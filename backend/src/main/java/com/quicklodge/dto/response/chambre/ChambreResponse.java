package com.quicklodge.dto.response.chambre;

import com.quicklodge.entity.StatutChambre;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChambreResponse {

    private Long id;
    private String nom;
    /** Nom choisi par l'hôte pour les voyageurs (peut être plus long que {@link #nom}). */
    private String nomPersonnalise;
    private Long typeChambreId;
    private String typeChambreLibelle;
    private StatutChambre statut;
    private BigDecimal prixNuit;
    private Integer capacitePersonnes;
    private BigDecimal surfaceM2;
    private Long etablissementId;
    private Instant createdAt;
    /** URLs publiques servies sous {@code /api/files/...}. */
    private List<String> photoUrls;
}
