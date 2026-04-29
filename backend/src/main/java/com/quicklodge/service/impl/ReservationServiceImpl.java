package com.quicklodge.service.impl;

import com.quicklodge.dto.request.reservation.CancelReservationRequest;
import com.quicklodge.dto.request.reservation.CreateReservationRequest;
import com.quicklodge.dto.request.reservation.ReservationServiceItemRequest;
import com.quicklodge.dto.request.reservation.UpdateReservationRequest;
import com.quicklodge.dto.response.reservation.ReservationDetailResponse;
import com.quicklodge.dto.response.reservation.ReservationResponse;
import com.quicklodge.entity.*;
import com.quicklodge.exception.BadRequestException;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.mapper.ReservationMapper;
import com.quicklodge.repository.*;
import com.quicklodge.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private record ServiceQty(com.quicklodge.entity.Service catalogService, int quantity) {}

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final EtablissementRepository etablissementRepository;
    private final ChambreRepository chambreRepository;
    private final ServiceRepository serviceRepository;
    private final ReservationMapper mapper;

    @Value("${app.reservation.client-cancel-min-days-before-start:1}")
    private int clientCancelMinDaysBeforeStart;

    @Value("${app.reservation.client-cancel-motif-min-length:10}")
    private int clientCancelMotifMinLength;

    private static final DateTimeFormatter DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    /**
     * Normalise le statut d'une réservation en fonction des dates.
     * - Si dateFin < today -> TERMINEE
     * - Si dateDebut <= today < dateFin -> EN_COURS (pour les réservations déjà confirmées)
     * - Si today < dateDebut -> on évite EN_COURS (revient à CONFIRMEE)
     *
     * Ne modifie pas ANNULEE.
     */
    private void normalizeStatutByDates(Reservation r, LocalDate today) {
        if (r == null || r.getDateDebut() == null || r.getDateFin() == null) return;
        if (r.getStatut() == StatutReservation.ANNULEE) return;

        if (r.getDateFin().isBefore(today)) {
            r.setStatut(StatutReservation.TERMINEE);
            return;
        }

        boolean started = !r.getDateDebut().isAfter(today); // dateDebut <= today
        boolean notEnded = r.getDateFin().isAfter(today);   // today < dateFin

        // EN_COURS seulement si la réservation est confirmée (ou déjà en cours) et que le séjour a commencé.
        if ((r.getStatut() == StatutReservation.CONFIRMEE || r.getStatut() == StatutReservation.EN_COURS)
                && started && notEnded) {
            r.setStatut(StatutReservation.EN_COURS);
            return;
        }

        // Si la réservation est marquée EN_COURS mais le séjour n'a pas commencé, on revient à CONFIRMEE.
        if (r.getStatut() == StatutReservation.EN_COURS && !started) {
            r.setStatut(StatutReservation.CONFIRMEE);
        }
    }

    /**
     * Dernier jour calendaire (inclus) où le client peut encore modifier ou annuler en ligne avant {@code dateDebut}.
     * Ex. N=1, arrivée le 12 → dernier jour d'action le 11.
     */
    private LocalDate lastInclusiveClientActionDay(LocalDate dateDebut) {
        return dateDebut.minusDays(clientCancelMinDaysBeforeStart);
    }

    private boolean clientMayActOnline(LocalDate today, LocalDate dateDebut) {
        return !today.isAfter(lastInclusiveClientActionDay(dateDebut));
    }

    @Override
    @Transactional
    public ReservationResponse create(Long userId, CreateReservationRequest request) {
        User client = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Etablissement etablissement = etablissementRepository.findById(request.getEtablissementId())
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", request.getEtablissementId()));
        if (request.getDateFin().isBefore(request.getDateDebut()) || request.getDateDebut().isBefore(LocalDate.now())) {
            throw new BadRequestException("Dates invalides");
        }
        List<Chambre> chambres = request.getChambreIds().stream()
                .map(id -> chambreRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chambre", "id", id)))
                .toList();
        for (Chambre ch : chambres) {
            if (!ch.getEtablissement().getId().equals(etablissement.getId())) {
                throw new BadRequestException("La chambre n'appartient pas à cet établissement");
            }
            if (reservationRepository.existsReservationActive(ch.getId(), request.getDateDebut(), request.getDateFin())) {
                throw new BadRequestException("Chambre non disponible pour ces dates");
            }
        }

        List<ServiceQty> resolved = resolveServiceQuantities(
                request.getServiceSelections(), request.getServiceIds(), etablissement.getId());
        List<ServiceQty> paidToPersist = paidLinesForPersistence(resolved);
        BigDecimal montantTotal = computeMontantTotal(chambres, resolved, request.getDateDebut(), request.getDateFin());
        Reservation r = Reservation.builder()
                .client(client)
                .etablissement(etablissement)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .nombreVoyageurs(request.getNombrePersonnes())
                .statut(StatutReservation.EN_ATTENTE)
                .montantTotal(montantTotal)
                .commentaire(request.getCommentaire())
                .chambres(new HashSet<>(chambres))
                .build();
        for (ServiceQty sq : paidToPersist) {
            ReservationServiceLine line = ReservationServiceLine.builder()
                    .reservation(r)
                    .service(sq.catalogService())
                    .quantity(sq.quantity())
                    .build();
            r.getServiceLines().add(line);
        }
        r = reservationRepository.save(r);
        ReservationResponse out = mapper.toResponse(r);
        applyClientReservationEnrichments(out, r);
        return out;
    }

    @Override
    @Transactional
    public ReservationResponse update(Long reservationId, Long userId, UpdateReservationRequest request) {
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));
        if (!r.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Seul le client peut modifier sa réservation");
        }
        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            throw new BadRequestException("Réservation close : modification impossible");
        }
        if (r.getStatut() == StatutReservation.EN_COURS) {
            throw new BadRequestException("Séjour en cours : contactez l'hébergeur pour toute modification");
        }
        if (r.getStatut() != StatutReservation.EN_ATTENTE && r.getStatut() != StatutReservation.CONFIRMEE) {
            throw new BadRequestException("Ce statut ne permet pas la modification en ligne");
        }

        LocalDate today = LocalDate.now();
        if (!clientMayActOnline(today, r.getDateDebut())) {
            throw new BadRequestException(String.format(
                    "Délai de modification dépassé. Dernière date incluse : %s. Contactez l'hébergeur.",
                    DATE_FR.format(lastInclusiveClientActionDay(r.getDateDebut()))));
        }

        if (!r.getEtablissement().getId().equals(request.getEtablissementId())) {
            throw new BadRequestException("L'établissement ne peut pas être changé");
        }
        if (request.getDateFin().isBefore(request.getDateDebut())) {
            throw new BadRequestException("Dates invalides");
        }
        if (request.getDateDebut().isBefore(today)) {
            throw new BadRequestException("La date de début ne peut pas être dans le passé");
        }
        if (!clientMayActOnline(today, request.getDateDebut())) {
            throw new BadRequestException(String.format(
                    "La nouvelle date d'arrivée ne respecte pas le délai : dernière modification en ligne jusqu'au %s inclus pour cette nouvelle arrivée le %s.",
                    DATE_FR.format(lastInclusiveClientActionDay(request.getDateDebut())),
                    DATE_FR.format(request.getDateDebut())));
        }

        Etablissement etablissement = r.getEtablissement();
        List<Chambre> chambres = request.getChambreIds().stream()
                .map(id -> chambreRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chambre", "id", id)))
                .toList();
        for (Chambre ch : chambres) {
            if (!ch.getEtablissement().getId().equals(etablissement.getId())) {
                throw new BadRequestException("La chambre n'appartient pas à cet établissement");
            }
            if (reservationRepository.existsReservationActiveExcluding(
                    ch.getId(), request.getDateDebut(), request.getDateFin(), reservationId)) {
                throw new BadRequestException("Chambre non disponible pour ces dates");
            }
        }

        List<ServiceQty> resolved =
                resolveServiceQuantities(request.getServiceSelections(), request.getServiceIds(), etablissement.getId());
        List<ServiceQty> paidToPersist = paidLinesForPersistence(resolved);
        BigDecimal newTotal = computeMontantTotal(chambres, resolved, request.getDateDebut(), request.getDateFin());

        List<Paiement> paiements = r.getPaiements();
        if (paiements != null) {
            long effectue = paiements.stream().filter(p -> p.getStatut() == StatutPaiement.EFFECTUE).count();
            if (effectue > 1) {
                throw new BadRequestException(
                        "Modification impossible : plusieurs paiements enregistrés. Contactez l'hébergeur.");
            }
            if (effectue == 1) {
                paiements.stream()
                        .filter(p -> p.getStatut() == StatutPaiement.EFFECTUE)
                        .findFirst()
                        .ifPresent(p -> p.setMontant(newTotal));
            }
        }

        r.setDateDebut(request.getDateDebut());
        r.setDateFin(request.getDateFin());
        r.setNombreVoyageurs(request.getNombrePersonnes());
        r.setCommentaire(request.getCommentaire());
        r.setMontantTotal(newTotal);
        r.getChambres().clear();
        r.getChambres().addAll(new HashSet<>(chambres));
        r.getServiceLines().clear();
        for (ServiceQty sq : paidToPersist) {
            ReservationServiceLine line = ReservationServiceLine.builder()
                    .reservation(r)
                    .service(sq.catalogService())
                    .quantity(sq.quantity())
                    .build();
            r.getServiceLines().add(line);
        }

        r = reservationRepository.save(r);
        ReservationResponse out = mapper.toResponse(r);
        applyClientReservationEnrichments(out, r);
        return out;
    }

    @Override
    @Transactional
    public ReservationResponse confirm(Long reservationId, Long userId) {
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));
        if (!r.getClient().getId().equals(userId) && !r.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Accès refusé à cette réservation");
        }
        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            throw new BadRequestException("Impossible de confirmer une réservation annulée ou terminée");
        }
        if (r.getStatut() != StatutReservation.EN_ATTENTE) {
            throw new BadRequestException("Seules les réservations en attente peuvent être confirmées");
        }
        r.setStatut(StatutReservation.CONFIRMEE);
        r = reservationRepository.save(r);
        ReservationResponse out = mapper.toResponse(r);
        if (r.getClient().getId().equals(userId)) {
            applyClientReservationEnrichments(out, r);
        }
        return out;
    }

    @Override
    @Transactional
    public ReservationResponse cancel(Long reservationId, Long userId, CancelReservationRequest request) {
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));
        boolean isClient = r.getClient().getId().equals(userId);
        boolean isHost = r.getEtablissement().getProprietaire().getId().equals(userId);
        if (!isClient && !isHost) {
            throw new ForbiddenException("Accès refusé à cette réservation");
        }
        if (r.getStatut() == StatutReservation.ANNULEE) {
            throw new BadRequestException("Cette réservation est déjà annulée");
        }
        if (r.getStatut() == StatutReservation.TERMINEE) {
            throw new BadRequestException("Une réservation terminée ne peut pas être annulée");
        }

        LocalDate today = LocalDate.now();

        if (isClient) {
            if (r.getStatut() == StatutReservation.EN_COURS) {
                throw new BadRequestException("Séjour en cours : contactez l'hébergeur pour toute modification");
            }
            if (r.getStatut() != StatutReservation.EN_ATTENTE && r.getStatut() != StatutReservation.CONFIRMEE) {
                throw new BadRequestException("Ce statut ne permet pas l'annulation en ligne");
            }
            if (!clientMayActOnline(today, r.getDateDebut())) {
                throw new BadRequestException(String.format(
                        "Délai d'annulation en ligne dépassé. Dernière date incluse : %s. Contactez l'hébergeur.",
                        DATE_FR.format(lastInclusiveClientActionDay(r.getDateDebut()))));
            }
            String motif = request != null && request.getMotif() != null ? request.getMotif().trim() : "";
            if (motif.length() < clientCancelMotifMinLength) {
                throw new BadRequestException(String.format(
                        "Un motif d'annulation d'au moins %d caractères est obligatoire (comportement abusif sanctionné par nos CGU).",
                        clientCancelMotifMinLength));
            }
            r.setMotifAnnulation(motif);
        } else {
            if (r.getStatut() != StatutReservation.EN_ATTENTE
                    && r.getStatut() != StatutReservation.CONFIRMEE
                    && r.getStatut() != StatutReservation.EN_COURS) {
                throw new BadRequestException("Annulation hôte impossible pour ce statut");
            }
            String motifHote = (request != null && StringUtils.hasText(request.getMotif()))
                    ? request.getMotif().trim()
                    : "Annulation par l'hébergeur";
            if (motifHote.length() > 500) {
                throw new BadRequestException("Motif trop long");
            }
            r.setMotifAnnulation(motifHote);
        }

        r.setCancelledAt(Instant.now());
        r.setStatut(StatutReservation.ANNULEE);
        r = reservationRepository.save(r);
        ReservationResponse out = mapper.toResponse(r);
        if (isClient) {
            applyClientReservationEnrichments(out, r);
        }
        return out;
    }

    @Override
    @Transactional
    public List<ReservationResponse> findByUser(Long userId) {
        LocalDate today = LocalDate.now();
        List<Reservation> list = reservationRepository.findByClientId(userId);
        for (Reservation r : list) {
            normalizeStatutByDates(r, today);
        }
        return list.stream()
                .map(r -> {
                    ReservationResponse out = mapper.toResponse(r);
                    applyClientReservationEnrichments(out, r);
                    return out;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReservationDetailResponse findById(Long id, Long userId) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", id));
        if (!r.getClient().getId().equals(userId) && !r.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Accès refusé à cette réservation");
        }
        normalizeStatutByDates(r, LocalDate.now());
        ReservationDetailResponse out = mapper.toDetailResponse(r);
        if (r.getClient().getId().equals(userId)) {
            enrichClientCancellationOnDetail(out, r);
            enrichClientModificationOnDetail(out, r);
        }
        if (r.getEtablissement().getProprietaire().getId().equals(userId)) {
            enrichHostCancellationOnDetail(out, r);
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> findByHote(Long userId) {
        List<Etablissement> etabs = etablissementRepository.findByProprietaireId(userId);
        return etabs.stream()
                .flatMap(e -> reservationRepository.findByEtablissementId(e.getId()).stream())
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    private void applyClientReservationEnrichments(ReservationResponse dto, Reservation r) {
        enrichClientCancellationOnResponse(dto, r);
        enrichClientModificationOnResponse(dto, r);
    }

    private BigDecimal computeMontantTotal(
            List<Chambre> chambres,
            List<ServiceQty> serviceQuantities,
            LocalDate dateDebut,
            LocalDate dateFin) {
        long nights = Math.max(1, ChronoUnit.DAYS.between(dateDebut, dateFin));
        BigDecimal montantChambres = chambres.stream()
                .map(ch -> ch.getPrixNuit().multiply(BigDecimal.valueOf(nights)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // Only PAID services contribute to the total. INCLUDED services are ignored for the amount.
        BigDecimal montantServices = serviceQuantities.stream()
                .filter(sq -> sq.catalogService().getPricingType() == null
                        || sq.catalogService().getPricingType() == ServicePricingType.PAID)
                .map(sq -> {
                    com.quicklodge.entity.Service s = sq.catalogService();
                    int qty = Math.max(1, sq.quantity());
                    String unite = s.getUnite();
                    boolean perNuit = unite == null || unite.toLowerCase().contains("nuit");
                    BigDecimal multiplier = perNuit ? BigDecimal.valueOf(nights) : BigDecimal.ONE;
                    return s.getPrix().multiply(multiplier).multiply(BigDecimal.valueOf(qty));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return montantChambres.add(montantServices);
    }

    private List<ServiceQty> paidLinesForPersistence(List<ServiceQty> resolved) {
        return resolved.stream()
                .filter(sq -> sq.catalogService().getPricingType() == null
                        || sq.catalogService().getPricingType() == ServicePricingType.PAID)
                .toList();
    }

    private List<ServiceQty> resolveServiceQuantities(
            List<ReservationServiceItemRequest> selections,
            List<Long> legacyServiceIds,
            Long etablissementId) {
        Map<Long, Integer> merged = new LinkedHashMap<>();
        if (selections != null) {
            for (ReservationServiceItemRequest item : selections) {
                if (item == null || item.getServiceId() == null) {
                    continue;
                }
                int q = item.getQuantity() == null ? 1 : item.getQuantity();
                if (q < 1 || q > 99) {
                    throw new BadRequestException("Quantité invalide pour un service (1 à 99)");
                }
                merged.merge(item.getServiceId(), q, Integer::sum);
            }
        } else if (legacyServiceIds != null) {
            for (Long id : legacyServiceIds) {
                if (id == null) {
                    continue;
                }
                merged.merge(id, 1, Integer::sum);
            }
        }
        List<ServiceQty> out = new ArrayList<>();
        for (Map.Entry<Long, Integer> e : merged.entrySet()) {
            com.quicklodge.entity.Service s = loadAndValidateService(e.getKey(), etablissementId);
            out.add(new ServiceQty(s, e.getValue()));
        }
        return out;
    }

    private com.quicklodge.entity.Service loadAndValidateService(Long id, Long etablissementId) {
        com.quicklodge.entity.Service s =
                serviceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
        // Services "catalogue admin" : catalogue sans établissement (etablissement_id NULL) → autorisés aussi.
        // On bloque seulement les services rattachés à un AUTRE établissement.
        if (s.getCatalogue() == null) {
            throw new BadRequestException("Service invalide (catalogue manquant)");
        }
        if (s.getCatalogue().getEtablissement() != null
                && !s.getCatalogue().getEtablissement().getId().equals(etablissementId)) {
            throw new BadRequestException("Un service n'appartient pas à cet établissement");
        }
        if (Boolean.FALSE.equals(s.getActif())) {
            throw new BadRequestException("Un service sélectionné est indisponible");
        }
        return s;
    }

    private void enrichClientCancellationOnResponse(ReservationResponse dto, Reservation r) {
        LocalDate today = LocalDate.now();
        LocalDate lastDay = lastInclusiveClientActionDay(r.getDateDebut());
        dto.setRegleAnnulationClient(String.format(
                "Annulation en ligne : motif obligatoire (minimum %d caractères). "
                        + "Possible jusqu'au %s inclus (arrivée le %s). Au-delà, contactez l'hébergeur.",
                clientCancelMotifMinLength,
                DATE_FR.format(lastDay),
                DATE_FR.format(r.getDateDebut())));

        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient("Réservation close.");
            return;
        }
        if (r.getStatut() == StatutReservation.EN_COURS) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient("Séjour en cours : annulation via l'hébergeur uniquement.");
            return;
        }
        if (r.getStatut() != StatutReservation.EN_ATTENTE && r.getStatut() != StatutReservation.CONFIRMEE) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient("Ce statut ne permet pas l'annulation en ligne.");
            return;
        }
        if (!clientMayActOnline(today, r.getDateDebut())) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient(String.format(
                    "Délai dépassé. Dernière date d'annulation en ligne : %s.",
                    DATE_FR.format(lastDay)));
            return;
        }
        dto.setAnnulationParClientPossible(true);
        dto.setMotifRefusAnnulationClient(null);
    }

    private void enrichClientModificationOnResponse(ReservationResponse dto, Reservation r) {
        LocalDate today = LocalDate.now();
        LocalDate lastDay = lastInclusiveClientActionDay(r.getDateDebut());
        dto.setRegleModificationClient(String.format(
                "Modification en ligne (dates, voyageurs, chambres, services, commentaire) : même délai que l'annulation, "
                        + "jusqu'au %s inclus pour une arrivée le %s. L'établissement ne peut pas être changé.",
                DATE_FR.format(lastDay),
                DATE_FR.format(r.getDateDebut())));

        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient("Réservation close.");
            return;
        }
        if (r.getStatut() == StatutReservation.EN_COURS) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient("Séjour en cours : modification via l'hébergeur uniquement.");
            return;
        }
        if (r.getStatut() != StatutReservation.EN_ATTENTE && r.getStatut() != StatutReservation.CONFIRMEE) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient("Ce statut ne permet pas la modification en ligne.");
            return;
        }
        if (!clientMayActOnline(today, r.getDateDebut())) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient(String.format(
                    "Délai dépassé. Dernière date pour modifier : %s.",
                    DATE_FR.format(lastDay)));
            return;
        }
        dto.setModificationParClientPossible(true);
        dto.setMotifRefusModificationClient(null);
    }

    private void enrichClientCancellationOnDetail(ReservationDetailResponse dto, Reservation r) {
        LocalDate today = LocalDate.now();
        LocalDate lastDay = lastInclusiveClientActionDay(r.getDateDebut());
        dto.setRegleAnnulationClient(String.format(
                "Annulation en ligne : motif obligatoire (minimum %d caractères). "
                        + "Possible jusqu'au %s inclus (arrivée le %s). Au-delà, contactez l'hébergeur.",
                clientCancelMotifMinLength,
                DATE_FR.format(lastDay),
                DATE_FR.format(r.getDateDebut())));

        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient("Réservation close.");
            return;
        }
        if (r.getStatut() == StatutReservation.EN_COURS) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient("Séjour en cours : annulation via l'hébergeur uniquement.");
            return;
        }
        if (r.getStatut() != StatutReservation.EN_ATTENTE && r.getStatut() != StatutReservation.CONFIRMEE) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient("Ce statut ne permet pas l'annulation en ligne.");
            return;
        }
        if (!clientMayActOnline(today, r.getDateDebut())) {
            dto.setAnnulationParClientPossible(false);
            dto.setMotifRefusAnnulationClient(String.format(
                    "Délai dépassé. Dernière date d'annulation en ligne : %s.",
                    DATE_FR.format(lastDay)));
            return;
        }
        dto.setAnnulationParClientPossible(true);
        dto.setMotifRefusAnnulationClient(null);
    }

    private void enrichClientModificationOnDetail(ReservationDetailResponse dto, Reservation r) {
        LocalDate today = LocalDate.now();
        LocalDate lastDay = lastInclusiveClientActionDay(r.getDateDebut());
        dto.setRegleModificationClient(String.format(
                "Modification en ligne (dates, voyageurs, chambres, services, commentaire) : même délai que l'annulation, "
                        + "jusqu'au %s inclus pour une arrivée le %s. L'établissement ne peut pas être changé.",
                DATE_FR.format(lastDay),
                DATE_FR.format(r.getDateDebut())));

        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient("Réservation close.");
            return;
        }
        if (r.getStatut() == StatutReservation.EN_COURS) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient("Séjour en cours : modification via l'hébergeur uniquement.");
            return;
        }
        if (r.getStatut() != StatutReservation.EN_ATTENTE && r.getStatut() != StatutReservation.CONFIRMEE) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient("Ce statut ne permet pas la modification en ligne.");
            return;
        }
        if (!clientMayActOnline(today, r.getDateDebut())) {
            dto.setModificationParClientPossible(false);
            dto.setMotifRefusModificationClient(String.format(
                    "Délai dépassé. Dernière date pour modifier : %s.",
                    DATE_FR.format(lastDay)));
            return;
        }
        dto.setModificationParClientPossible(true);
        dto.setMotifRefusModificationClient(null);
    }

    private void enrichHostCancellationOnDetail(ReservationDetailResponse dto, Reservation r) {
        if (r.getStatut() == StatutReservation.ANNULEE || r.getStatut() == StatutReservation.TERMINEE) {
            dto.setAnnulationParHotePossible(false);
            dto.setRegleAnnulationHote(null);
            return;
        }
        dto.setAnnulationParHotePossible(true);
        dto.setRegleAnnulationHote(
                "Annulation côté hébergeur : à utiliser pour un motif légitime (surbooking, force majeure, etc.). "
                        + "Le client voit la réservation comme annulée.");
    }
}
