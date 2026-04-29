package com.quicklodge.dto.response.service;

import com.quicklodge.entity.CategorieService;
import com.quicklodge.entity.ServiceAvailability;
import com.quicklodge.entity.ServicePricingType;
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
public class ServiceResponse {

    private Long id;
    private String libelle;
    private String description;
    private CategorieService categorie;
    private ServicePricingType pricingType;
    private ServiceAvailability disponibilite;
    private BigDecimal prix;
    private String unite;
    private String conditionsUtilisation;
    private Boolean actif;
    /** URL publique servie par {@code /api/files/...} si une image a été enregistrée. */
    private String imageUrl;
    private Instant createdAt;
}

