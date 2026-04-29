package com.quicklodge.dto.response.etablissement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriToggleResponse {
    private Long etablissementId;
    /** true si l’établissement est maintenant dans les favoris de l’utilisateur. */
    private boolean favori;
    /** Nombre total de favoris (cœurs) sur l’établissement. */
    private int favorisCount;
}

