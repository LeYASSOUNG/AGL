package com.quicklodge.dto.request.etablissement;

import jakarta.validation.constraints.NotBlank;
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
public class CreateEtablissementRequest {

    @NotNull(message = "Type d'établissement requis")
    private Long typeEtablissementId;

    @NotBlank(message = "Nom requis")
    @Size(max = 255)
    private String nom;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "Adresse requise")
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

    /**
     * Optionnel : data URLs {@code data:image/jpeg;base64,...} (JPEG, PNG ou WebP).
     */
    private List<String> photos;
}
