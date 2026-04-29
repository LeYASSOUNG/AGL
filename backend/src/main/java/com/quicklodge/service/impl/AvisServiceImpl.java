package com.quicklodge.service.impl;

import com.quicklodge.dto.request.avis.CreateAvisRequest;
import com.quicklodge.dto.response.avis.AvisResponse;
import com.quicklodge.entity.Avis;
import com.quicklodge.entity.Reservation;
import com.quicklodge.entity.StatutReservation;
import com.quicklodge.exception.BadRequestException;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.mapper.AvisMapper;
import com.quicklodge.repository.AvisRepository;
import com.quicklodge.repository.ReservationRepository;
import com.quicklodge.service.AvisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvisServiceImpl implements AvisService {

    private final AvisRepository avisRepository;
    private final ReservationRepository reservationRepository;
    private final AvisMapper mapper;

    @Override
    @Transactional
    public AvisResponse create(Long userId, CreateAvisRequest request) {
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", request.getReservationId()));
        if (!reservation.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le client de cette réservation");
        }
        if (!sejourPermetAvisClient(reservation)) {
            throw new BadRequestException(
                    "Un avis ne peut être posté qu'après la date de fin du séjour (ou statut Terminée), pour une réservation confirmée ou en cours.");
        }
        if (avisRepository.findByReservationId(request.getReservationId()).isPresent()) {
            throw new BadRequestException("Un avis existe déjà pour cette réservation");
        }
        Avis a = Avis.builder()
                .auteur(reservation.getClient())
                .etablissement(reservation.getEtablissement())
                .reservation(reservation)
                .note(request.getNote())
                .commentaire(request.getCommentaire())
                .build();
        a = avisRepository.save(a);
        return mapper.toResponse(a);
    }

    /**
     * Avis autorisé si la réservation n'est pas annulée, et soit déjà au statut TERMINEE,
     * soit confirmée / en cours avec date de fin de séjour atteinte (jour de départ inclus).
     */
    private static boolean sejourPermetAvisClient(Reservation reservation) {
        if (reservation.getStatut() == StatutReservation.ANNULEE) {
            return false;
        }
        if (reservation.getStatut() == StatutReservation.TERMINEE) {
            return true;
        }
        if (reservation.getStatut() == StatutReservation.EN_ATTENTE) {
            return false;
        }
        if (reservation.getStatut() != StatutReservation.CONFIRMEE
                && reservation.getStatut() != StatutReservation.EN_COURS) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !reservation.getDateFin().isAfter(today);
    }

    @Override
    @Transactional
    public AvisResponse update(Long avisId, Long userId, String reponseHote) {
        Avis a = avisRepository.findById(avisId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis", "id", avisId));
        if (!a.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Seul l'hôte peut répondre à cet avis");
        }
        a.setReponseHote(reponseHote);
        a.setDateReponse(java.time.Instant.now());
        return mapper.toResponse(avisRepository.save(a));
    }

    @Override
    @Transactional
    public void delete(Long avisId, Long userId) {
        Avis a = avisRepository.findById(avisId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis", "id", avisId));
        if (!a.getAuteur().getId().equals(userId)) {
            throw new ForbiddenException("Seul l'auteur peut supprimer cet avis");
        }
        avisRepository.delete(a);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvisResponse> findByEtablissement(Long etablissementId) {
        return avisRepository.findByEtablissementId(etablissementId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvisResponse> findByAuteur(Long auteurId) {
        return avisRepository.findByAuteurId(auteurId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
}
