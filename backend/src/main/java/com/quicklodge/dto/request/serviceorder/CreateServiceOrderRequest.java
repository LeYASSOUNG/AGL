package com.quicklodge.dto.request.serviceorder;

import com.quicklodge.dto.request.reservation.ReservationServiceItemRequest;
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
public class CreateServiceOrderRequest {

    /** Date souhaitée (optionnelle selon le service). */
    private LocalDate serviceDate;

    @NotNull(message = "Au moins un service requis")
    @Size(min = 1)
    @Valid
    private List<ReservationServiceItemRequest> serviceSelections;

    @Size(max = 500)
    private String commentaire;
}

