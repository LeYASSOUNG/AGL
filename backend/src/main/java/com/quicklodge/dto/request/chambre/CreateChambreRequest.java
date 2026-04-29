package com.quicklodge.dto.request.chambre;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChambreRequest {

    @NotNull(message = "ID établissement requis")
    private Long etablissementId;

    /**
     * Nom affiché (style Booking) : obligatoire sauf si {@link #nom} est fourni (compat. ancienne API).
     */
    @Size(max = 255)
    private String nomPersonnalise;

    /**
     * Titre court optionnel (liste / recherche). Sinon dérivé du nom personnalisé (tronqué à 100).
     */
    @Size(max = 100)
    private String nom;

    @NotNull(message = "Type de chambre requis")
    private Long typeChambreId;

    @NotNull(message = "Prix par nuit requis")
    private BigDecimal prixNuit;

    private Integer capacitePersonnes;
    private BigDecimal surfaceM2;

    /** Images en data URL (JPEG/PNG/WebP), optionnel. */
    private List<String> photos;
}
