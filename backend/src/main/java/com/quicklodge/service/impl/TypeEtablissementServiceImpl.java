package com.quicklodge.service.impl;

import com.quicklodge.dto.request.type.TypeEtablissementRequest;
import com.quicklodge.dto.response.type.TypeEtablissementResponse;
import com.quicklodge.entity.TypeEtablissement;
import com.quicklodge.exception.ConflictException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.TypeEtablissementRepository;
import com.quicklodge.service.TypeEtablissementService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TypeEtablissementServiceImpl implements TypeEtablissementService {

    private final TypeEtablissementRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<TypeEtablissementResponse> getAllActifs() {
        return repository.findByActifTrue().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public TypeEtablissementResponse create(TypeEtablissementRequest request) {
        TypeEtablissement t = TypeEtablissement.builder()
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
    public TypeEtablissementResponse update(Long id, TypeEtablissementRequest request) {
        TypeEtablissement t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeEtablissement", "id", id));
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
        TypeEtablissement t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeEtablissement", "id", id));
        t.setActif(!Boolean.TRUE.equals(t.getActif()));
        repository.save(t);
    }

    private TypeEtablissementResponse toResponse(TypeEtablissement t) {
        return TypeEtablissementResponse.builder()
                .id(t.getId())
                .libelle(t.getLibelle())
                .description(t.getDescription())
                .build();
    }
}

