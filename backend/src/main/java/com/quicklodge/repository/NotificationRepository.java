package com.quicklodge.repository;

import com.quicklodge.entity.Notification;
import com.quicklodge.entity.StatutNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByDestinataireIdOrderByCreatedAtDesc(Long destinataireId, Pageable pageable);

    List<Notification> findByDestinataireIdAndStatut(Long destinataireId, StatutNotification statut);
}
