package com.quicklodge.dto.response.avis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvisResponse {

    private Long id;
    private Integer note;
    private String commentaire;
    private String reponseHote;
    private Instant dateReponse;
    private Long auteurId;
    private Long etablissementId;
    private Long reservationId;
    private Instant createdAt;
}
