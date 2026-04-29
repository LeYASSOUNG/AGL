package com.quicklodge.service.impl;

import com.quicklodge.dto.request.type.TypeNotificationRequest;
import com.quicklodge.dto.response.type.TypeNotificationResponse;
import com.quicklodge.entity.TypeNotification;
import com.quicklodge.exception.ConflictException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.TypeNotificationRepository;
import com.quicklodge.service.TypeNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TypeNotificationServiceImpl implements TypeNotificationService {

    private final TypeNotificationRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<TypeNotificationResponse> getAllActifs() {
        return repository.findByActifTrue().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public TypeNotificationResponse create(TypeNotificationRequest request) {
        TypeNotification t = TypeNotification.builder()
                .libelle(request.getLibelle())
                .description(request.getDescription())
                .actif(true)
                .build();
        try {
            return toResponse(repository.save(t));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Libellé déjà utilisé");
        }
    }

    @Override
    @Transactional
    public TypeNotificationResponse update(Long id, TypeNotificationRequest request) {
        TypeNotification t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeNotification", "id", id));
        t.setLibelle(request.getLibelle());
        t.setDescription(request.getDescription());
        try {
            return toResponse(repository.save(t));
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Libellé déjà utilisé");
        }
    }

    @Override
    @Transactional
    public void toggleActif(Long id) {
        TypeNotification t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeNotification", "id", id));
        t.setActif(!Boolean.TRUE.equals(t.getActif()));
        repository.save(t);
    }

    private TypeNotificationResponse toResponse(TypeNotification t) {
        return TypeNotificationResponse.builder()
                .id(t.getId())
                .libelle(t.getLibelle())
                .description(t.getDescription())
                .build();
    }
}
