package com.quicklodge.mapper;

import com.quicklodge.dto.response.notification.NotificationResponse;
import com.quicklodge.dto.response.type.TypeNotificationResponse;
import com.quicklodge.entity.Notification;
import com.quicklodge.entity.TypeNotification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification n) {
        if (n == null) return null;
        return NotificationResponse.builder()
                .id(n.getId())
                .type(toTypeResponse(n.getType()))
                .statut(n.getStatut())
                .titre(n.getTitre())
                .contenu(n.getContenu())
                .lien(n.getLien())
                .luAt(n.getLuAt())
                .destinataireId(n.getDestinataire() != null ? n.getDestinataire().getId() : null)
                .createdAt(n.getCreatedAt())
                .build();
    }

    private TypeNotificationResponse toTypeResponse(TypeNotification t) {
        if (t == null) return null;
        return TypeNotificationResponse.builder()
                .id(t.getId())
                .libelle(t.getLibelle())
                .description(t.getDescription())
                .build();
    }
}
