package com.quicklodge.mapper;

import com.quicklodge.dto.response.paiement.PaiementResponse;
import com.quicklodge.entity.Paiement;
import org.springframework.stereotype.Component;

@Component
public class PaiementMapper {

    public PaiementResponse toResponse(Paiement p) {
        if (p == null) return null;
        return PaiementResponse.builder()
                .id(p.getId())
                .montant(p.getMontant())
                .statut(p.getStatut())
                .modePaiement(p.getModePaiement())
                .referenceExterne(p.getReferenceExterne())
                .dateEffectif(p.getDateEffectif())
                .reservationId(p.getReservation() != null ? p.getReservation().getId() : null)
                .serviceOrderId(p.getServiceOrder() != null ? p.getServiceOrder().getId() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
