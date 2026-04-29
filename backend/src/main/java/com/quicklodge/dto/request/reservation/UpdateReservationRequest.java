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
public class UpdateReservationRequest {

    @NotNull(message = "ID établissement requis")
    private Long etablissementId;

    @NotNull(message = "Au moins une chambre requise")
    @Size(min = 1)
    private List<Long> chambreIds;

    private List<Long> serviceIds;

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
