package com.quicklodge.service.impl;

import com.quicklodge.dto.request.chambre.CreateChambreRequest;
import com.quicklodge.dto.request.chambre.UpdateChambreRequest;
import com.quicklodge.dto.response.chambre.ChambreResponse;
import com.quicklodge.entity.Chambre;
import com.quicklodge.entity.ChambrePhoto;
import com.quicklodge.entity.Etablissement;
import com.quicklodge.entity.TypeChambre;
import com.quicklodge.exception.BadRequestException;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.mapper.ChambreMapper;
import com.quicklodge.repository.ChambreRepository;
import com.quicklodge.repository.EtablissementRepository;
import com.quicklodge.repository.ReservationRepository;
import com.quicklodge.repository.TypeChambreRepository;
import com.quicklodge.service.ChambreService;
import com.quicklodge.service.EtablissementPhotoStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChambreServiceImpl implements ChambreService {

    private final ChambreRepository chambreRepository;
    private final EtablissementRepository etablissementRepository;
    private final ReservationRepository reservationRepository;
    private final TypeChambreRepository typeChambreRepository;
    private final ChambreMapper mapper;
    private final EtablissementPhotoStorageService photoStorage;

    @Override
    @Transactional
    public ChambreResponse create(Long userId, CreateChambreRequest request) {
        Etablissement etablissement = etablissementRepository.findById(request.getEtablissementId())
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", request.getEtablissementId()));
        if (!etablissement.getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        String nomPersonnalise = resolveNomPersonnalise(request);
        if (!StringUtils.hasText(nomPersonnalise)) {
            throw new BadRequestException("Le nom personnalisé de la chambre est requis");
        }
        String nomCourt = resolveNomCourt(request, nomPersonnalise);
        Chambre c = mapper.toEntity(request, etablissement, nomCourt, nomPersonnalise);
        TypeChambre type = typeChambreRepository.findById(request.getTypeChambreId())
                .orElseThrow(() -> new ResourceNotFoundException("TypeChambre", "id", request.getTypeChambreId()));
        c.setTypeChambre(type);
        c = chambreRepository.save(c);
        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            attachPhotosFromDataUrls(c, request.getPhotos());
            chambreRepository.save(c);
        }
        Chambre withPhotos = chambreRepository.findDetailById(c.getId()).orElse(c);
        return mapper.toResponse(withPhotos);
    }

    @Override
    @Transactional
    public ChambreResponse update(Long chambreId, Long userId, UpdateChambreRequest request) {
        Chambre c = chambreRepository.findDetailById(chambreId)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre", "id", chambreId));
        if (!c.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        if (request.getTypeChambreId() != null) {
            TypeChambre type = typeChambreRepository.findById(request.getTypeChambreId())
                    .orElseThrow(() -> new ResourceNotFoundException("TypeChambre", "id", request.getTypeChambreId()));
            c.setTypeChambre(type);
        }
        mapper.updateEntityFromRequest(c, request);
        if (request.getPhotos() != null) {
            removeAllPhotos(c);
            if (!request.getPhotos().isEmpty()) {
                attachPhotosFromDataUrls(c, request.getPhotos());
            }
        }
        chambreRepository.save(c);
        Chambre refreshed = chambreRepository.findDetailById(chambreId).orElse(c);
        return mapper.toResponse(refreshed);
    }

    @Override
    @Transactional
    public void delete(Long chambreId, Long userId) {
        Chambre c = chambreRepository.findDetailById(chambreId)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre", "id", chambreId));
        if (!c.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        if (reservationRepository.existsAnyReservationForChambre(chambreId)) {
            throw new ForbiddenException("Impossible de supprimer cette chambre : elle est liée à une ou plusieurs réservations");
        }
        deletePhotoFiles(c);
        chambreRepository.delete(c);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChambreResponse> findByEtablissement(Long etablissementId) {
        return chambreRepository.findByEtablissementIdWithPhotos(etablissementId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkDisponibilite(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        return !reservationRepository.existsReservationActive(chambreId, dateDebut, dateFin);
    }

    private void attachPhotosFromDataUrls(Chambre c, List<String> dataUrls) {
        if (dataUrls == null || dataUrls.isEmpty()) {
            return;
        }
        long nonBlank = dataUrls.stream().filter(s -> s != null && !s.isBlank()).count();
        if (nonBlank > EtablissementPhotoStorageService.MAX_PHOTOS_PER_CHAMBRE) {
            throw new BadRequestException("Au plus " + EtablissementPhotoStorageService.MAX_PHOTOS_PER_CHAMBRE + " photos par chambre");
        }
        if (c.getPhotos() == null) {
            c.setPhotos(new ArrayList<>());
        }
        int order = c.getPhotos().size();
        for (String dataUrl : dataUrls) {
            if (dataUrl == null || dataUrl.isBlank()) {
                continue;
            }
            EtablissementPhotoStorageService.DecodedImage decoded = photoStorage.parseDataUrl(dataUrl);
            String path = photoStorage.saveChambreFile(c.getId(), decoded);
            ChambrePhoto ph = ChambrePhoto.builder()
                    .chambre(c)
                    .storagePath(path)
                    .sortOrder(order++)
                    .build();
            c.getPhotos().add(ph);
        }
    }

    private void removeAllPhotos(Chambre c) {
        if (c.getPhotos() == null || c.getPhotos().isEmpty()) {
            return;
        }
        for (ChambrePhoto p : new ArrayList<>(c.getPhotos())) {
            photoStorage.deleteStoredFile(p.getStoragePath());
        }
        c.getPhotos().clear();
    }

    private void deletePhotoFiles(Chambre c) {
        if (c.getPhotos() == null) {
            return;
        }
        for (ChambrePhoto p : new ArrayList<>(c.getPhotos())) {
            photoStorage.deleteStoredFile(p.getStoragePath());
        }
    }

    private static String resolveNomPersonnalise(CreateChambreRequest request) {
        if (StringUtils.hasText(request.getNomPersonnalise())) {
            return request.getNomPersonnalise().trim();
        }
        if (StringUtils.hasText(request.getNom())) {
            return request.getNom().trim();
        }
        return "";
    }

    private static String resolveNomCourt(CreateChambreRequest request, String nomPersonnalise) {
        if (StringUtils.hasText(request.getNom())) {
            String n = request.getNom().trim();
            return n.length() > 100 ? n.substring(0, 100) : n;
        }
        return nomPersonnalise.length() > 100 ? nomPersonnalise.substring(0, 100) : nomPersonnalise;
    }
}
