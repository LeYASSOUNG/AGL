package com.quicklodge.service;

import com.quicklodge.dto.request.notification.CreateNotificationRequest;
import com.quicklodge.dto.response.notification.NotificationResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {

    NotificationResponse send(CreateNotificationRequest request);
    NotificationResponse markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    List<NotificationResponse> findByUser(Long userId, Pageable pageable);
}
