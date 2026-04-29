package com.quicklodge.mapper;

import com.quicklodge.dto.response.avis.AvisAdminResponse;
import com.quicklodge.dto.response.avis.AvisResponse;
import com.quicklodge.entity.Avis;
import org.springframework.stereotype.Component;

@Component
public class AvisMapper {

    public AvisAdminResponse toAdminResponse(Avis a) {
        if (a == null) return null;
        return AvisAdminResponse.builder()
                .id(a.getId())
                .note(a.getNote())
                .commentaire(a.getCommentaire())
                .reponseHote(a.getReponseHote())
                .dateReponse(a.getDateReponse())
                .createdAt(a.getCreatedAt())
                .reservationId(a.getReservation() != null ? a.getReservation().getId() : null)
                .etablissementId(a.getEtablissement() != null ? a.getEtablissement().getId() : null)
                .etablissementNom(a.getEtablissement() != null ? a.getEtablissement().getNom() : null)
                .auteurId(a.getAuteur() != null ? a.getAuteur().getId() : null)
                .auteurEmail(a.getAuteur() != null ? a.getAuteur().getEmail() : null)
                .auteurPrenom(a.getAuteur() != null ? a.getAuteur().getFirstName() : null)
                .auteurNom(a.getAuteur() != null ? a.getAuteur().getLastName() : null)
                .build();
    }

    public AvisResponse toResponse(Avis a) {
        if (a == null) return null;
        return AvisResponse.builder()
                .id(a.getId())
                .note(a.getNote())
                .commentaire(a.getCommentaire())
                .reponseHote(a.getReponseHote())
                .dateReponse(a.getDateReponse())
                .auteurId(a.getAuteur() != null ? a.getAuteur().getId() : null)
                .etablissementId(a.getEtablissement() != null ? a.getEtablissement().getId() : null)
                .reservationId(a.getReservation() != null ? a.getReservation().getId() : null)
                .createdAt(a.getCreatedAt())
                .build();
    }
}
