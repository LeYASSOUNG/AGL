package com.quicklodge.mapper;

import com.quicklodge.dto.request.etablissement.CreateEtablissementRequest;
import com.quicklodge.dto.request.etablissement.UpdateEtablissementRequest;
import com.quicklodge.dto.response.etablissement.EtablissementDetailResponse;
import com.quicklodge.dto.response.etablissement.EtablissementResponse;
import com.quicklodge.dto.response.service.ServiceResponse;
import com.quicklodge.entity.Etablissement;
import com.quicklodge.entity.EtablissementPhoto;
import com.quicklodge.entity.User;
import com.quicklodge.util.EtablissementPhotoUrlBuilder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EtablissementMapper {

    private final ChambreMapper chambreMapper;
    private final EtablissementPhotoUrlBuilder photoUrlBuilder;

    public EtablissementResponse toResponse(Etablissement e) {
        if (e == null) return null;
        return EtablissementResponse.builder()
                .id(e.getId())
                .typeEtablissementId(e.getTypeEtablissement() != null ? e.getTypeEtablissement().getId() : null)
                .typeEtablissementLibelle(safeTypeEtablissementLibelle(e))
                .nom(e.getNom())
                .description(e.getDescription())
                .adresse(e.getAdresse())
                .ville(e.getVille())
                .codePostal(e.getCodePostal())
                .pays(e.getPays())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .actif(e.getActif())
                .valideAdmin(Boolean.TRUE.equals(e.getValideAdmin()))
                .favorisCount(e.getFavorisCount() != null ? e.getFavorisCount() : 0)
                .proprietaireId(e.getProprietaire() != null ? e.getProprietaire().getId() : null)
                .createdAt(e.getCreatedAt())
                .photoUrls(mapPhotoUrls(e))
                .build();
    }

    public EtablissementDetailResponse toDetailResponse(Etablissement e) {
        if (e == null) return null;
        return EtablissementDetailResponse.builder()
                .id(e.getId())
                .typeEtablissementId(e.getTypeEtablissement() != null ? e.getTypeEtablissement().getId() : null)
                .typeEtablissementLibelle(safeTypeEtablissementLibelle(e))
                .nom(e.getNom())
                .description(e.getDescription())
                .adresse(e.getAdresse())
                .ville(e.getVille())
                .codePostal(e.getCodePostal())
                .pays(e.getPays())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .actif(e.getActif())
                .valideAdmin(Boolean.TRUE.equals(e.getValideAdmin()))
                .proprietaireId(e.getProprietaire() != null ? e.getProprietaire().getId() : null)
                .chambres(e.getChambres() != null
                        ? e.getChambres().stream().map(chambreMapper::toResponse).collect(Collectors.toList())
                        : null)
                .hasCatalogue(e.getCatalogueService() != null)
                .services(e.getCatalogueService() != null && e.getCatalogueService().getServices() != null
                        ? e.getCatalogueService().getServices().stream().map(s -> ServiceResponse.builder()
                                .id(s.getId())
                                .libelle(s.getLibelle())
                                .description(s.getDescription())
                                .categorie(s.getCategorie())
                                .pricingType(s.getPricingType())
                                .disponibilite(s.getDisponibilite())
                                .prix(s.getPrix())
                                .unite(s.getUnite())
                                .actif(s.getActif())
                                .conditionsUtilisation(s.getConditionsUtilisation())
                                .imageUrl(photoUrlBuilder.toPublicUrl(s.getImageStoragePath()))
                                .createdAt(s.getCreatedAt())
                                .build()
                        ).collect(Collectors.toList())
                        : List.of())
                .createdAt(e.getCreatedAt())
                .photoUrls(mapPhotoUrls(e))
                .build();
    }

    /**
     * Ne pas court-circuiter sur {@code !Hibernate.isInitialized(getPhotos())} : cela renvoyait toujours une liste
     * vide pour les résultats de recherche (photos lazy), alors que l’accès à la collection charge bien les fichiers.
     */
    private List<String> mapPhotoUrls(Etablissement e) {
        if (e.getPhotos() == null) {
            return List.of();
        }
        List<EtablissementPhoto> photos = new ArrayList<>(e.getPhotos());
        if (photos.isEmpty()) {
            return List.of();
        }
        return photos.stream()
                .sorted(Comparator.comparing(EtablissementPhoto::getSortOrder, Comparator.nullsFirst(Integer::compareTo)))
                .map(p -> photoUrlBuilder.toPublicUrl(p.getStoragePath()))
                .collect(Collectors.toList());
    }

    private String safeTypeEtablissementLibelle(Etablissement e) {
        if (e.getTypeEtablissement() == null) {
            return null;
        }
        try {
            return e.getTypeEtablissement().getLibelle();
        } catch (EntityNotFoundException ex) {
            return null;
        }
    }

    public Etablissement toEntity(CreateEtablissementRequest request, User proprietaire) {
        if (request == null) return null;
        return Etablissement.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .codePostal(request.getCodePostal())
                .pays(request.getPays())
                .latitude(request.getLatitude() != null ? request.getLatitude().doubleValue() : null)
                .longitude(request.getLongitude() != null ? request.getLongitude().doubleValue() : null)
                .actif(true)
                .proprietaire(proprietaire)
                .chambres(new ArrayList<>())
                .photos(new ArrayList<>())
                .valideAdmin(false)
                .build();
    }

    public void updateEntityFromRequest(Etablissement e, UpdateEtablissementRequest request) {
        if (request.getNom() != null) e.setNom(request.getNom());
        if (request.getDescription() != null) e.setDescription(request.getDescription());
        if (request.getAdresse() != null) e.setAdresse(request.getAdresse());
        if (request.getVille() != null) e.setVille(request.getVille());
        if (request.getCodePostal() != null) e.setCodePostal(request.getCodePostal());
        if (request.getPays() != null) e.setPays(request.getPays());
        if (request.getLatitude() != null) e.setLatitude(request.getLatitude().doubleValue());
        if (request.getLongitude() != null) e.setLongitude(request.getLongitude().doubleValue());
        if (request.getActif() != null) e.setActif(request.getActif());
    }
}
