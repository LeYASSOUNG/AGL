package com.quicklodge.service.impl;

import com.quicklodge.dto.request.type.TypeChambreRequest;
import com.quicklodge.dto.response.type.TypeChambreResponse;
import com.quicklodge.entity.TypeChambre;
import com.quicklodge.exception.ConflictException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.TypeChambreRepository;
import com.quicklodge.service.TypeChambreService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TypeChambreServiceImpl implements TypeChambreService {

    private final TypeChambreRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<TypeChambreResponse> getAllActifs() {
        return repository.findByActifTrue().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public TypeChambreResponse create(TypeChambreRequest request) {
        TypeChambre t = TypeChambre.builder()
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
    public TypeChambreResponse update(Long id, TypeChambreRequest request) {
        TypeChambre t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeChambre", "id", id));
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
        TypeChambre t = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TypeChambre", "id", id));
        t.setActif(!Boolean.TRUE.equals(t.getActif()));
        repository.save(t);
    }

    private TypeChambreResponse toResponse(TypeChambre t) {
        return TypeChambreResponse.builder()
                .id(t.getId())
                .libelle(t.getLibelle())
                .description(t.getDescription())
                .build();
    }
}

