package com.quicklodge.repository;

import com.quicklodge.entity.TypeNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TypeNotificationRepository extends JpaRepository<TypeNotification, Long> {

    List<TypeNotification> findByActifTrue();
}
