package com.quicklodge.dto.request.reservation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReservationRequest {

    @NotNull(message = "ID établissement requis")
    private Long etablissementId;

    @NotNull(message = "Au moins une chambre requise")
    @Size(min = 1)
    private List<Long> chambreIds;

    /** Ancien format : chaque id compte pour une quantité de 1. Préférer {@link #serviceSelections}. */
    private List<Long> serviceIds;

    /** Services additionnels avec quantité (recommandé). Si non vide, prime sur {@link #serviceIds}. */
    @Valid
    private List<ReservationServiceItemRequest> serviceSelections;

    @NotNull(message = "Date de début requise")
    private LocalDate dateDebut;

    @NotNull(message = "Date de fin requise")
    private LocalDate dateFin;

    private Integer nombrePersonnes;

    @Size(max = 500)
    private String commentaire;
}
