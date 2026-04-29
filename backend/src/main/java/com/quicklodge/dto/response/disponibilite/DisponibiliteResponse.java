package com.quicklodge.dto.response.disponibilite;

import com.quicklodge.entity.StatutDisponibilite;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisponibiliteResponse {

    private Long id;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private StatutDisponibilite statut;
    private Long chambreId;
    private Instant createdAt;
}
