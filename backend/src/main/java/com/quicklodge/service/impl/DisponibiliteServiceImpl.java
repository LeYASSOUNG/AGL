package com.quicklodge.service.impl;

import com.quicklodge.dto.request.disponibilite.CreateDisponibiliteRequest;
import com.quicklodge.dto.response.disponibilite.DisponibiliteResponse;
import com.quicklodge.entity.Chambre;
import com.quicklodge.entity.Disponibilite;
import com.quicklodge.entity.StatutDisponibilite;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.ChambreRepository;
import com.quicklodge.repository.DisponibiliteRepository;
import com.quicklodge.service.DisponibiliteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisponibiliteServiceImpl implements DisponibiliteService {

    private final DisponibiliteRepository disponibiliteRepository;
    private final ChambreRepository chambreRepository;

    private static DisponibiliteResponse toResponse(Disponibilite d) {
        return DisponibiliteResponse.builder()
                .id(d.getId())
                .dateDebut(d.getDateDebut())
                .dateFin(d.getDateFin())
                .statut(d.getStatut())
                .chambreId(d.getChambre() != null ? d.getChambre().getId() : null)
                .createdAt(d.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public DisponibiliteResponse create(Long userId, CreateDisponibiliteRequest request) {
        Chambre chambre = chambreRepository.findById(request.getChambreId())
                .orElseThrow(() -> new ResourceNotFoundException("Chambre", "id", request.getChambreId()));
        if (!chambre.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        Disponibilite d = Disponibilite.builder()
                .chambre(chambre)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .statut(request.getStatut() != null ? request.getStatut() : StatutDisponibilite.OUVERTE)
                .build();
        d = disponibiliteRepository.save(d);
        return toResponse(d);
    }

    @Override
    @Transactional
    public DisponibiliteResponse block(Long disponibiliteId, Long userId) {
        Disponibilite d = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new ResourceNotFoundException("Disponibilite", "id", disponibiliteId));
        if (!d.getChambre().getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        d.setStatut(StatutDisponibilite.FERMEE);
        return toResponse(disponibiliteRepository.save(d));
    }

    @Override
    @Transactional
    public DisponibiliteResponse free(Long disponibiliteId, Long userId) {
        Disponibilite d = disponibiliteRepository.findById(disponibiliteId)
                .orElseThrow(() -> new ResourceNotFoundException("Disponibilite", "id", disponibiliteId));
        if (!d.getChambre().getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        d.setStatut(StatutDisponibilite.OUVERTE);
        return toResponse(disponibiliteRepository.save(d));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisponibiliteResponse> findByChambre(Long chambreId) {
        return disponibiliteRepository.findByChambreId(chambreId).stream()
                .map(DisponibiliteServiceImpl::toResponse)
                .collect(Collectors.toList());
    }
}
