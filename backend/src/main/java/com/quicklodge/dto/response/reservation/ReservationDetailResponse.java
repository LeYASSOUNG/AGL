package com.quicklodge.dto.response.reservation;

import com.quicklodge.dto.response.chambre.ChambreResponse;
import com.quicklodge.dto.response.paiement.PaiementResponse;
import com.quicklodge.entity.StatutReservation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationDetailResponse {

    private Long id;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer nombreVoyageurs;
    private StatutReservation statut;
    private BigDecimal montantTotal;
    private String commentaire;
    private Long clientId;
    private Long etablissementId;
    private Set<ChambreResponse> chambres;
    /** Identifiants de services (sans doublon) — pratique pour les anciens clients ; préférer {@link #serviceLines}. */
    private Set<Long> serviceIds;
    /** Services réservés avec quantité et libellé. */
    private List<ReservationServiceLineResponse> serviceLines;
    private List<PaiementResponse> paiements;
    private Instant createdAt;

    private Boolean annulationParClientPossible;
    private String regleAnnulationClient;
    private String motifRefusAnnulationClient;

    /** Vue hôte : possibilité d'annuler (hors statuts terminaux). */
    private Boolean annulationParHotePossible;
    private String regleAnnulationHote;

    private Boolean modificationParClientPossible;
    private String regleModificationClient;
    private String motifRefusModificationClient;
}
