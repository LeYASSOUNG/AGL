package com.quicklodge.mapper;

import com.quicklodge.dto.response.reservation.ReservationDetailResponse;
import com.quicklodge.dto.response.reservation.ReservationResponse;
import com.quicklodge.dto.response.reservation.ReservationServiceLineResponse;
import com.quicklodge.entity.Reservation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ReservationMapper {

    private final ChambreMapper chambreMapper;
    private final PaiementMapper paiementMapper;

    public ReservationResponse toResponse(Reservation r) {
        if (r == null) return null;
        return ReservationResponse.builder()
                .id(r.getId())
                .dateDebut(r.getDateDebut())
                .dateFin(r.getDateFin())
                .nombreVoyageurs(r.getNombreVoyageurs())
                .statut(r.getStatut())
                .montantTotal(r.getMontantTotal())
                .commentaire(r.getCommentaire())
                .clientId(r.getClient() != null ? r.getClient().getId() : null)
                .etablissementId(r.getEtablissement() != null ? r.getEtablissement().getId() : null)
                .createdAt(r.getCreatedAt())
                .build();
    }

    public ReservationDetailResponse toDetailResponse(Reservation r) {
        if (r == null) return null;
        return ReservationDetailResponse.builder()
                .id(r.getId())
                .dateDebut(r.getDateDebut())
                .dateFin(r.getDateFin())
                .nombreVoyageurs(r.getNombreVoyageurs())
                .statut(r.getStatut())
                .montantTotal(r.getMontantTotal())
                .commentaire(r.getCommentaire())
                .clientId(r.getClient() != null ? r.getClient().getId() : null)
                .etablissementId(r.getEtablissement() != null ? r.getEtablissement().getId() : null)
                .chambres(r.getChambres() != null
                        ? r.getChambres().stream().map(chambreMapper::toResponse).collect(Collectors.toSet())
                        : null)
                .serviceLines(r.getServiceLines() != null && !r.getServiceLines().isEmpty()
                        ? r.getServiceLines().stream()
                                .map(line -> ReservationServiceLineResponse.builder()
                                        .serviceId(line.getService().getId())
                                        .quantity(line.getQuantity())
                                        .libelle(line.getService().getLibelle())
                                        .build())
                                .collect(Collectors.toList())
                        : List.of())
                .serviceIds(r.getServiceLines() != null && !r.getServiceLines().isEmpty()
                        ? r.getServiceLines().stream()
                                .map(line -> line.getService().getId())
                                .collect(Collectors.toCollection(LinkedHashSet::new))
                        : Collections.emptySet())
                .paiements(r.getPaiements() != null
                        ? r.getPaiements().stream().map(paiementMapper::toResponse).collect(Collectors.toList())
                        : null)
                .createdAt(r.getCreatedAt())
                .build();
    }
}
