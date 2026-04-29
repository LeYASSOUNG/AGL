package com.quicklodge.dto.response.serviceorder;

import com.quicklodge.entity.StatutServiceOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOrderResponse {
    private Long id;
    private StatutServiceOrder statut;
    private LocalDate serviceDate;
    private BigDecimal montantTotal;
    private String commentaire;
    private List<ServiceOrderLineResponse> lines;
    private Instant createdAt;
}

