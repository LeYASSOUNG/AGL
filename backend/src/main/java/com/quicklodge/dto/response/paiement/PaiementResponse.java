package com.quicklodge.dto.response.paiement;

import com.quicklodge.entity.ModePaiement;
import com.quicklodge.entity.StatutPaiement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaiementResponse {

    private Long id;
    private BigDecimal montant;
    private StatutPaiement statut;
    private ModePaiement modePaiement;
    private String referenceExterne;
    private Instant dateEffectif;
    private Long reservationId;
    private Long serviceOrderId;
    private Instant createdAt;
}
