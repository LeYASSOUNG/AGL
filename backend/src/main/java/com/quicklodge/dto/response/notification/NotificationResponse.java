package com.quicklodge.dto.response.notification;

import com.quicklodge.dto.response.type.TypeNotificationResponse;
import com.quicklodge.entity.StatutNotification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private TypeNotificationResponse type;
    private StatutNotification statut;
    private String titre;
    private String contenu;
    private String lien;
    private Instant luAt;
    private Long destinataireId;
    private Instant createdAt;
}
