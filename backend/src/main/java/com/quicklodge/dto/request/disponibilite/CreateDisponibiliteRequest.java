package com.quicklodge.dto.request.disponibilite;

import com.quicklodge.entity.StatutDisponibilite;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDisponibiliteRequest {

    @NotNull(message = "ID chambre requis")
    private Long chambreId;

    @NotNull(message = "Date de début requise")
    private LocalDate dateDebut;

    @NotNull(message = "Date de fin requise")
    private LocalDate dateFin;

    private StatutDisponibilite statut;
}
