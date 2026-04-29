package com.quicklodge.dto.request.type;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeBadgeRequest {

    @NotBlank(message = "Libellé requis")
    @Size(max = 100)
    private String libelle;

    @Size(max = 500)
    private String description;
}
