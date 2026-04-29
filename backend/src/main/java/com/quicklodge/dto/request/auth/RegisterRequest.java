package com.quicklodge.dto.request.auth;

import jakarta.validation.constraints.Email;
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
public class RegisterRequest {

    @NotBlank(message = "Prénom requis")
    @Size(max = 100)
    private String prenom;

    @NotBlank(message = "Nom requis")
    @Size(max = 100)
    private String nom;

    @NotBlank(message = "Email requis")
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Mot de passe requis")
    @Size(min = 8, max = 100)
    private String motDePasse;

    @Size(max = 30)
    private String telephone;
}
