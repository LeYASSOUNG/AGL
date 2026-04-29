package com.quicklodge.mapper;

import com.quicklodge.dto.request.chambre.CreateChambreRequest;
import com.quicklodge.dto.request.chambre.UpdateChambreRequest;
import com.quicklodge.dto.response.chambre.ChambreResponse;
import com.quicklodge.entity.Chambre;
import com.quicklodge.entity.ChambrePhoto;
import com.quicklodge.entity.Etablissement;
import com.quicklodge.util.EtablissementPhotoUrlBuilder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ChambreMapper {

    private final EtablissementPhotoUrlBuilder photoUrlBuilder;

    public ChambreResponse toResponse(Chambre c) {
        if (c == null) return null;
        return ChambreResponse.builder()
                .id(c.getId())
                .nom(c.getNom())
                .nomPersonnalise(c.getNomPersonnalise())
                .typeChambreId(c.getTypeChambre() != null ? c.getTypeChambre().getId() : null)
                .typeChambreLibelle(safeTypeChambreLibelle(c))
                .statut(c.getStatut())
                .prixNuit(c.getPrixNuit())
                .capacitePersonnes(c.getCapacitePersonnes())
                .surfaceM2(c.getSurfaceM2())
                .etablissementId(c.getEtablissement() != null ? c.getEtablissement().getId() : null)
                .createdAt(c.getCreatedAt())
                .photoUrls(mapChambrePhotoUrls(c))
                .build();
    }

    private List<String> mapChambrePhotoUrls(Chambre c) {
        if (!Hibernate.isInitialized(c.getPhotos()) || c.getPhotos() == null || c.getPhotos().isEmpty()) {
            return List.of();
        }
        return c.getPhotos().stream()
                .sorted(Comparator.comparing(ChambrePhoto::getSortOrder, Comparator.nullsFirst(Integer::compareTo)))
                .map(p -> photoUrlBuilder.toPublicUrl(p.getStoragePath()))
                .filter(url -> url != null && !url.isBlank())
                .collect(Collectors.toList());
    }

    private String safeTypeChambreLibelle(Chambre c) {
        if (c.getTypeChambre() == null) {
            return null;
        }
        try {
            return c.getTypeChambre().getLibelle();
        } catch (EntityNotFoundException ex) {
            return null;
        }
    }

    public Chambre toEntity(CreateChambreRequest request, Etablissement etablissement, String nomCourt, String nomPersonnalise) {
        if (request == null) return null;
        return Chambre.builder()
                .nom(nomCourt)
                .nomPersonnalise(nomPersonnalise)
                .statut(com.quicklodge.entity.StatutChambre.DISPONIBLE)
                .prixNuit(request.getPrixNuit())
                .capacitePersonnes(request.getCapacitePersonnes())
                .surfaceM2(request.getSurfaceM2())
                .etablissement(etablissement)
                .build();
    }

    public void updateEntityFromRequest(Chambre c, UpdateChambreRequest request) {
        if (StringUtils.hasText(request.getNomPersonnalise())) {
            String np = request.getNomPersonnalise().trim();
            c.setNomPersonnalise(np);
            if (request.getNom() == null) {
                c.setNom(truncate(np, 100));
            }
        }
        if (request.getNom() != null && StringUtils.hasText(request.getNom())) {
            c.setNom(truncate(request.getNom().trim(), 100));
        }
        if (request.getStatut() != null) c.setStatut(request.getStatut());
        if (request.getPrixNuit() != null) c.setPrixNuit(request.getPrixNuit());
        if (request.getCapacitePersonnes() != null) c.setCapacitePersonnes(request.getCapacitePersonnes());
        if (request.getSurfaceM2() != null) c.setSurfaceM2(request.getSurfaceM2());
    }

    private static String truncate(String s, int max) {
        if (!StringUtils.hasText(s)) {
            return s;
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }
}
