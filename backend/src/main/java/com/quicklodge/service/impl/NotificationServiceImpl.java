package com.quicklodge.service.impl;

import com.quicklodge.dto.request.notification.CreateNotificationRequest;
import com.quicklodge.dto.response.notification.NotificationResponse;
import com.quicklodge.entity.Notification;
import com.quicklodge.entity.StatutNotification;
import com.quicklodge.entity.User;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.mapper.NotificationMapper;
import com.quicklodge.entity.TypeNotification;
import com.quicklodge.repository.NotificationRepository;
import com.quicklodge.repository.TypeNotificationRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TypeNotificationRepository typeNotificationRepository;
    private final NotificationMapper mapper;

    @Override
    @Transactional
    public NotificationResponse send(CreateNotificationRequest request) {
        User destinataire = userRepository.findById(request.getDestinataireId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getDestinataireId()));
        TypeNotification typeNotif = typeNotificationRepository.findById(request.getTypeNotificationId())
                .orElseThrow(() -> new ResourceNotFoundException("TypeNotification", "id", request.getTypeNotificationId()));
        Notification n = Notification.builder()
                .destinataire(destinataire)
                .type(typeNotif)
                .statut(StatutNotification.NON_LU)
                .titre(request.getTitre())
                .contenu(request.getContenu())
                .lien(request.getLien())
                .build();
        n = notificationRepository.save(n);
        return mapper.toResponse(n);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        if (!n.getDestinataire().getId().equals(userId)) {
            throw new ForbiddenException("Accès refusé à cette notification");
        }
        n.setStatut(StatutNotification.LU);
        n.setLuAt(Instant.now());
        return mapper.toResponse(notificationRepository.save(n));
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findByDestinataireIdAndStatut(userId, StatutNotification.NON_LU)
                .forEach(n -> {
                    n.setStatut(StatutNotification.LU);
                    n.setLuAt(Instant.now());
                    notificationRepository.save(n);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> findByUser(Long userId, Pageable pageable) {
        return notificationRepository.findByDestinataireIdOrderByCreatedAtDesc(userId, pageable).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
}
