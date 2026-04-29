package com.quicklodge.dto.request.notification;

import jakarta.validation.constraints.NotBlank;
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
public class CreateNotificationRequest {

    @NotNull(message = "ID destinataire requis")
    private Long destinataireId;

    @NotNull(message = "Type de notification requis")
    private Long typeNotificationId;

    @NotBlank(message = "Titre requis")
    @Size(max = 500)
    private String titre;

    @Size(max = 2000)
    private String contenu;

    @Size(max = 500)
    private String lien;
}
