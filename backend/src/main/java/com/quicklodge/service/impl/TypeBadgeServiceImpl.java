package com.quicklodge.service.impl;

import com.quicklodge.dto.request.type.TypeBadgeRequest;
import com.quicklodge.dto.response.type.TypeBadgeResponse;
import com.quicklodge.entity.TypeBadge;
import com.quicklodge.exception.ConflictException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.TypeBadgeRepository;
import com.quicklodge.service.TypeBadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TypeBadgeServiceImpl implements TypeBadgeService {

    private final TypeBadgeRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<TypeBadgeResponse> getAllActifs() {
        return repository.findByActifTrue().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public TypeBadgeResponse create(TypeBadgeRequest request) {
        TypeBadge t = TypeBadge.builder()
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
    public TypeBadgeResponse update(Long id, TypeBadgeRequest request) {
        TypeBadge t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeBadge", "id", id));
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
        TypeBadge t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeBadge", "id", id));
        t.setActif(!Boolean.TRUE.equals(t.getActif()));
        repository.save(t);
    }

    private TypeBadgeResponse toResponse(TypeBadge t) {
        return TypeBadgeResponse.builder()
                .id(t.getId())
                .libelle(t.getLibelle())
                .description(t.getDescription())
                .build();
    }
}
