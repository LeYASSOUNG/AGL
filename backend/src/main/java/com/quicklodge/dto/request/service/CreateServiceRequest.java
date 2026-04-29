package com.quicklodge.dto.request.service;

import com.quicklodge.entity.CategorieService;
import com.quicklodge.entity.ServiceAvailability;
import com.quicklodge.entity.ServicePricingType;
import jakarta.validation.constraints.NotBlank;
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
public class CreateServiceRequest {

    @NotNull(message = "ID établissement requis")
    private Long etablissementId;

    @NotBlank(message = "Libellé requis")
    @Size(max = 150)
    private String libelle;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Prix requis")
    private BigDecimal prix;

    private CategorieService categorie;

    /** Inclus (gratuit) ou payant. */
    private ServicePricingType pricingType;

    /** Permanent / Sur demande / Saisonnier. */
    private ServiceAvailability disponibilite;

    @Size(max = 50)
    private String unite;

    @Size(max = 1000)
    private String conditionsUtilisation;

    private Boolean actif;

    /** data URL (JPEG, PNG, WebP) optionnel, décodé après création du service. */
    private String imageDataUrl;
}

