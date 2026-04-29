package com.quicklodge.dto.response.reservation;

import com.quicklodge.entity.StatutReservation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private Long id;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer nombreVoyageurs;
    private StatutReservation statut;
    private BigDecimal montantTotal;
    private String commentaire;
    private Long clientId;
    private Long etablissementId;
    private Instant createdAt;

    /** Renseigné lorsque la vue est celle du client voyageur. */
    private Boolean annulationParClientPossible;
    /** Texte d'information sur la politique d'annulation (ex. délai J-N). */
    private String regleAnnulationClient;
    /** Si {@link #annulationParClientPossible} est false : raison courte. */
    private String motifRefusAnnulationClient;

    private Boolean modificationParClientPossible;
    private String regleModificationClient;
    private String motifRefusModificationClient;
}
