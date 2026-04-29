package com.quicklodge.dto.request.user;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 100)
    private String prenom;

    @Size(max = 100)
    private String nom;

    @Size(max = 30)
    private String telephone;

    @Size(max = 500)
    private String avatarUrl;

    /** Data URL (JPEG/PNG/WebP) pour enregistrer un avatar sur le serveur. Chaîne vide = supprimer l’avatar. */
    @Size(max = 6_000_000)
    private String avatarDataUrl;
}
