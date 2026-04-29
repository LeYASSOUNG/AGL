package com.quicklodge.dto.request.chambre;

import com.quicklodge.entity.StatutChambre;
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
public class UpdateChambreRequest {

    @Size(max = 100)
    private String nom;

    @Size(max = 255)
    private String nomPersonnalise;

    private Long typeChambreId;
    private StatutChambre statut;
    private BigDecimal prixNuit;
    private Integer capacitePersonnes;
    private BigDecimal surfaceM2;

    /**
     * {@code null} = ne pas modifier les photos ; liste vide = tout supprimer ; sinon remplace l'ensemble (data URLs).
     */
    private List<String> photos;
}
