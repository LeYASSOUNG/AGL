package com.quicklodge.dto.request.reservation;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps optionnel pour {@code PUT /reservations/{id}/cancel}.
 * <p>Obligatoire pour le client : un motif suffisamment long. L'hôte peut omettre le corps.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelReservationRequest {

    @Size(max = 500, message = "Le motif ne peut pas dépasser 500 caractères")
    private String motif;
}
