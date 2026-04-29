package com.quicklodge.dto.request.reservation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationServiceItemRequest {

    @NotNull(message = "ID service requis")
    private Long serviceId;

    /** Absent ou null → traité comme 1. */
    @Min(1)
    @Max(99)
    private Integer quantity;
}
