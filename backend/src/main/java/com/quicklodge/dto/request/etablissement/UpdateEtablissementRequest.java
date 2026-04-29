package com.quicklodge.dto.request.etablissement;

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
public class UpdateEtablissementRequest {

    private Long typeEtablissementId;

    @Size(max = 255)
    private String nom;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String adresse;

    @Size(max = 100)
    private String ville;

    @Size(max = 20)
    private String codePostal;

    @Size(max = 100)
    private String pays;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private Boolean actif;

    /**
     * {@code null} = ne pas modifier les photos ; liste vide = tout supprimer ; sinon remplace l'ensemble.
     */
    private List<String> photos;
}
