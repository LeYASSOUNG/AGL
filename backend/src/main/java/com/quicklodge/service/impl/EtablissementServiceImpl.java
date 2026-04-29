package com.quicklodge.service.impl;

import com.quicklodge.dto.request.etablissement.CreateEtablissementRequest;
import com.quicklodge.dto.request.etablissement.UpdateEtablissementRequest;
import com.quicklodge.dto.response.common.PageResponse;
import com.quicklodge.dto.response.etablissement.EtablissementDetailResponse;
import com.quicklodge.dto.response.etablissement.EtablissementResponse;
import com.quicklodge.entity.Etablissement;
import com.quicklodge.entity.EtablissementPhoto;
import com.quicklodge.entity.TypeEtablissement;
import com.quicklodge.entity.User;
import com.quicklodge.exception.BadRequestException;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.mapper.EtablissementMapper;
import com.quicklodge.repository.EtablissementRepository;
import com.quicklodge.repository.ReservationRepository;
import com.quicklodge.repository.TypeEtablissementRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.EtablissementPhotoStorageService;
import com.quicklodge.service.EtablissementService;
import com.quicklodge.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EtablissementServiceImpl implements EtablissementService {

    private final EtablissementRepository etablissementRepository;
    private final UserRepository userRepository;
    private final TypeEtablissementRepository typeEtablissementRepository;
    private final ReservationRepository reservationRepository;
    private final EtablissementMapper mapper;
    private final EtablissementPhotoStorageService photoStorage;
    private final UserService userService;

    /** Dev helper: allow listing establishments not yet admin-validated. */
    @Value("${app.public.include-unvalidated:false}")
    private boolean includeUnvalidated;

    @Override
    @Transactional
    public EtablissementResponse create(Long userId, CreateEtablissementRequest request) {
        User proprietaire = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (!proprietaire.isHost() && etablissementRepository.countByProprietaireId(userId) > 0) {
            throw new ForbiddenException(
                    "Reconnectez-vous pour obtenir le rôle hôte, ou contactez le support pour un second établissement.");
        }
        Etablissement e = mapper.toEntity(request, proprietaire);
        TypeEtablissement type = typeEtablissementRepository.findById(request.getTypeEtablissementId())
                .orElseThrow(() -> new ResourceNotFoundException("TypeEtablissement", "id", request.getTypeEtablissementId()));
        e.setTypeEtablissement(type);
        e = etablissementRepository.save(e);
        userService.enableHostRole(proprietaire.getEmail());
        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            attachPhotosFromDataUrls(e, request.getPhotos());
            etablissementRepository.save(e);
        }
        Etablissement withPhotos = etablissementRepository.findDetailById(e.getId()).orElse(e);
        return mapper.toResponse(withPhotos);
    }

    @Override
    @Transactional
    public EtablissementResponse update(Long etablissementId, Long userId, UpdateEtablissementRequest request) {
        Etablissement e = etablissementRepository.findDetailById(etablissementId)
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", etablissementId));
        if (!e.getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        if (request.getTypeEtablissementId() != null) {
            TypeEtablissement type = typeEtablissementRepository.findById(request.getTypeEtablissementId())
                    .orElseThrow(() -> new ResourceNotFoundException("TypeEtablissement", "id", request.getTypeEtablissementId()));
            e.setTypeEtablissement(type);
        }
        mapper.updateEntityFromRequest(e, request);
        if (request.getPhotos() != null) {
            removeAllPhotos(e);
            attachPhotosFromDataUrls(e, request.getPhotos());
        }
        etablissementRepository.save(e);
        Etablissement refreshed = etablissementRepository.findDetailById(etablissementId).orElse(e);
        return mapper.toResponse(refreshed);
    }

    @Override
    @Transactional
    public void delete(Long etablissementId, Long userId) {
        Etablissement e = etablissementRepository.findDetailById(etablissementId)
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", etablissementId));
        if (!e.getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        // Si l'établissement est déjà référencé (réservations), on ne supprime pas physiquement : on désactive.
        if (reservationRepository.existsByEtablissementId(etablissementId)) {
            e.setActif(false);
            etablissementRepository.save(e);
            return;
        }
        deletePhotoFiles(e);
        etablissementRepository.delete(e);
    }

    @Override
    @Transactional(readOnly = true)
    public EtablissementDetailResponse findById(Long id) {
        Etablissement e = etablissementRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", id));
        return mapper.toDetailResponse(e);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EtablissementResponse> search(
            String ville,
            Long typeEtablissementId,
            String keyword,
            LocalDate dateDebut,
            LocalDate dateFin,
            Integer nombreVoyageurs,
            Pageable pageable) {
        String kw = keyword != null && !keyword.isBlank() ? keyword.trim() : null;
        LocalDate dd = dateDebut;
        LocalDate df = dateFin;
        Integer minV = nombreVoyageurs;
        if (dd == null || df == null || !df.isAfter(dd)) {
            dd = null;
            df = null;
            minV = null;
        } else if (minV == null || minV < 1) {
            minV = 1;
        }
        Page<Etablissement> page = etablissementRepository.search(
                ville, typeEtablissementId, kw, dd, df, minV, includeUnvalidated, pageable);
        return PageResponse.<EtablissementResponse>builder()
                .content(page.getContent().stream().map(mapper::toResponse).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EtablissementResponse> findByHote(Long userId) {
        return etablissementRepository.findByProprietaireIdWithPhotos(userId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listPublicVilles() {
        return etablissementRepository.findDistinctPublicVilles(includeUnvalidated);
    }

    private void attachPhotosFromDataUrls(Etablissement e, List<String> dataUrls) {
        if (dataUrls == null || dataUrls.isEmpty()) {
            return;
        }
        long nonBlank = dataUrls.stream().filter(s -> s != null && !s.isBlank()).count();
        if (nonBlank > EtablissementPhotoStorageService.MAX_PHOTOS_PER_ETABLISSEMENT) {
            throw new BadRequestException("Au plus " + EtablissementPhotoStorageService.MAX_PHOTOS_PER_ETABLISSEMENT + " photos par établissement");
        }
        if (e.getPhotos() == null) {
            e.setPhotos(new ArrayList<>());
        }
        int order = e.getPhotos().size();
        for (String dataUrl : dataUrls) {
            if (dataUrl == null || dataUrl.isBlank()) {
                continue;
            }
            EtablissementPhotoStorageService.DecodedImage decoded = photoStorage.parseDataUrl(dataUrl);
            String path = photoStorage.saveFile(e.getId(), decoded);
            EtablissementPhoto ph = EtablissementPhoto.builder()
                    .etablissement(e)
                    .storagePath(path)
                    .sortOrder(order++)
                    .build();
            e.getPhotos().add(ph);
        }
    }

    private void removeAllPhotos(Etablissement e) {
        if (e.getPhotos() == null || e.getPhotos().isEmpty()) {
            return;
        }
        for (EtablissementPhoto p : new ArrayList<>(e.getPhotos())) {
            photoStorage.deleteStoredFile(p.getStoragePath());
        }
        e.getPhotos().clear();
    }

    private void deletePhotoFiles(Etablissement e) {
        if (e.getPhotos() == null) {
            return;
        }
        for (EtablissementPhoto p : new ArrayList<>(e.getPhotos())) {
            photoStorage.deleteStoredFile(p.getStoragePath());
        }
    }
}
