package com.quicklodge.service;

import com.quicklodge.dto.request.type.TypeNotificationRequest;
import com.quicklodge.dto.response.type.TypeNotificationResponse;

import java.util.List;

public interface TypeNotificationService {

    List<TypeNotificationResponse> getAllActifs();

    TypeNotificationResponse create(TypeNotificationRequest request);

    TypeNotificationResponse update(Long id, TypeNotificationRequest request);

    void toggleActif(Long id);
}
