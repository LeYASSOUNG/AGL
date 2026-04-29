package com.quicklodge.dto.request.avis;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAvisRequest {

    @NotNull(message = "ID réservation requis")
    private Long reservationId;

    @NotNull(message = "Note requise")
    @Min(1)
    @Max(5)
    private Integer note;

    @Size(max = 2000)
    private String commentaire;
}
