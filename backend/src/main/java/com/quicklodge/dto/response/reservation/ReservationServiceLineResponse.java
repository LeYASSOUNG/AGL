package com.quicklodge.dto.response.reservation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationServiceLineResponse {

    private Long serviceId;
    private Integer quantity;
    private String libelle;
}
