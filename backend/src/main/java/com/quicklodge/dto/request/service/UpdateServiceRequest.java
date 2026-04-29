package com.quicklodge.dto.request.service;

import com.quicklodge.entity.CategorieService;
import com.quicklodge.entity.ServiceAvailability;
import com.quicklodge.entity.ServicePricingType;
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
public class UpdateServiceRequest {

    @Size(max = 150)
    private String libelle;

    @Size(max = 1000)
    private String description;

    private CategorieService categorie;

    private ServicePricingType pricingType;

    private ServiceAvailability disponibilite;

    @Size(max = 50)
    private String unite;

    private BigDecimal prix;

    @Size(max = 1000)
    private String conditionsUtilisation;

    private Boolean actif;

    /** Remplace l’image (data URL) si non vide. */
    private String imageDataUrl;

    /** Supprime l’image existante. */
    private Boolean clearImage;
}

