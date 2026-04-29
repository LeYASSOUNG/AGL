package com.quicklodge.dto.response.etablissement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtablissementResponse {

    private Long id;
    private Long typeEtablissementId;
    private String typeEtablissementLibelle;
    private String nom;
    private String description;
    private String adresse;
    private String ville;
    private String codePostal;
    private String pays;
    private Double latitude;
    private Double longitude;
    private Boolean actif;
    /** Approuvé par l’administration (visible en recherche publique). */
    private Boolean valideAdmin;
    /** Nombre de favoris (cœurs) attribués par les utilisateurs. */
    private Integer favorisCount;
    private Long proprietaireId;
    private Instant createdAt;
    /** URLs publiques servies sous {@code /api/files/...} */
    private List<String> photoUrls;
}
