package com.quicklodge.dto.response.service;

import com.quicklodge.entity.CategorieService;
import com.quicklodge.entity.ServiceAvailability;
import com.quicklodge.entity.ServicePricingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Service additionnel exposé sur la vitrine publique (avec l’établissement d’origine).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicServiceListingResponse {

    private Long id;
    private String libelle;
    private String description;
    private CategorieService categorie;
    private ServicePricingType pricingType;
    private ServiceAvailability disponibilite;
    private BigDecimal prix;
    private String unite;
    private Long etablissementId;
    private String etablissementNom;
    private String ville;
    /** URL publique si une image cataloguée existe. */
    private String imageUrl;
}
