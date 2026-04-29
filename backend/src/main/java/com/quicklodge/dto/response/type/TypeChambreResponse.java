package com.quicklodge.dto.response.type;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeChambreResponse {
    private Long id;
    private String libelle;
    private String description;
}

