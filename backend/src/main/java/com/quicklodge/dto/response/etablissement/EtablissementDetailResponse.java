package com.quicklodge.dto.response.etablissement;

import com.quicklodge.dto.response.chambre.ChambreResponse;
import com.quicklodge.dto.response.service.ServiceResponse;
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
public class EtablissementDetailResponse {

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
    private Boolean valideAdmin;
    private Long proprietaireId;
    private List<ChambreResponse> chambres;
    private Boolean hasCatalogue;
    private List<ServiceResponse> services;
    private Instant createdAt;
    private List<String> photoUrls;
}
