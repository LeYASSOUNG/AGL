package com.quicklodge.dto.response.avis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Avis enrichi pour le tableau de bord admin. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvisAdminResponse {

    private Long id;
    private Integer note;
    private String commentaire;
    private String reponseHote;
    private Instant dateReponse;
    private Instant createdAt;
    private Long reservationId;
    private Long etablissementId;
    private String etablissementNom;
    private Long auteurId;
    private String auteurEmail;
    private String auteurPrenom;
    private String auteurNom;
}
