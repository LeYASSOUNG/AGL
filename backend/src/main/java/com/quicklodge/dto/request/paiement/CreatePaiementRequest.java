package com.quicklodge.dto.request.paiement;

import com.quicklodge.entity.ModePaiement;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaiementRequest {

    /** Réservation chambre (optionnel si paiement d'une commande de service). */
    private Long reservationId;

    /** Commande de service (optionnel si paiement d'une réservation). */
    private Long serviceOrderId;

    @NotNull(message = "Montant requis")
    private BigDecimal montant;

    @NotNull(message = "Mode de paiement requis")
    private ModePaiement modePaiement;

    @Size(max = 255)
    private String referenceExterne;
}
