package com.quicklodge.controller;

import com.quicklodge.dto.request.service.CreateServiceRequest;
import com.quicklodge.dto.request.service.UpdateServiceRequest;
import com.quicklodge.dto.response.service.ServiceResponse;
import com.quicklodge.entity.CatalogueService;
import com.quicklodge.entity.CategorieService;
import com.quicklodge.entity.Service;
import com.quicklodge.entity.ServiceAvailability;
import com.quicklodge.entity.ServicePricingType;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.ServiceRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.CatalogueServiceService;
import com.quicklodge.service.EtablissementPhotoStorageService;
import com.quicklodge.util.EtablissementPhotoUrlBuilder;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/host")
@RequiredArgsConstructor
public class HostServicesController {

    private final CatalogueServiceService catalogueServiceService;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final EtablissementPhotoStorageService photoStorage;
    private final EtablissementPhotoUrlBuilder photoUrlBuilder;

    @PostMapping("/services")
    public ResponseEntity<ServiceResponse> create(@Valid @RequestBody CreateServiceRequest request) {
        Long userId = getCurrentUserId();

        CatalogueService cs = catalogueServiceService.findByEtablissementIdForHost(request.getEtablissementId());
        if (cs == null) {
            cs = catalogueServiceService.create(request.getEtablissementId(), userId, "Catalogue");
        }

        if (!cs.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }

        Service s = Service.builder()
                .libelle(request.getLibelle())
                .description(request.getDescription())
                .categorie(request.getCategorie() != null ? request.getCategorie() : CategorieService.AUTRE)
                .pricingType(request.getPricingType() != null ? request.getPricingType() : ServicePricingType.PAID)
                .disponibilite(request.getDisponibilite() != null ? request.getDisponibilite() : ServiceAvailability.PERMANENT)
                .prix(request.getPrix())
                .unite(request.getUnite())
                .conditionsUtilisation(request.getConditionsUtilisation())
                .actif(request.getActif() != null ? request.getActif() : true)
                .catalogue(cs)
                .build();

        // cs appartient au propriétaire connecté (vérifié ci-dessus)
        s = serviceRepository.save(s);
        if (StringUtils.hasText(request.getImageDataUrl())) {
            EtablissementPhotoStorageService.DecodedImage decoded = photoStorage.parseDataUrl(request.getImageDataUrl());
            String path = photoStorage.saveServiceFile(s.getId(), decoded);
            s.setImageStoragePath(path);
            s = serviceRepository.save(s);
        }
        return ResponseEntity.ok(toResponse(s));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<ServiceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateServiceRequest request) {
        Long userId = getCurrentUserId();

        Service s = serviceRepository
                .findByIdForHost(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        if (!s.getCatalogue().getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de ce service");
        }

        if (request.getLibelle() != null) s.setLibelle(request.getLibelle());
        if (request.getDescription() != null) s.setDescription(request.getDescription());
        if (request.getCategorie() != null) s.setCategorie(request.getCategorie());
        if (request.getPricingType() != null) s.setPricingType(request.getPricingType());
        if (request.getDisponibilite() != null) s.setDisponibilite(request.getDisponibilite());
        if (request.getPrix() != null) s.setPrix(request.getPrix());
        if (request.getUnite() != null) s.setUnite(request.getUnite());
        if (request.getConditionsUtilisation() != null) s.setConditionsUtilisation(request.getConditionsUtilisation());
        if (request.getActif() != null) s.setActif(request.getActif());

        if (Boolean.TRUE.equals(request.getClearImage())) {
            if (StringUtils.hasText(s.getImageStoragePath())) {
                photoStorage.deleteStoredFile(s.getImageStoragePath());
            }
            s.setImageStoragePath(null);
        } else if (StringUtils.hasText(request.getImageDataUrl())) {
            if (StringUtils.hasText(s.getImageStoragePath())) {
                photoStorage.deleteStoredFile(s.getImageStoragePath());
            }
            EtablissementPhotoStorageService.DecodedImage decoded = photoStorage.parseDataUrl(request.getImageDataUrl());
            String path = photoStorage.saveServiceFile(s.getId(), decoded);
            s.setImageStoragePath(path);
        }

        s = serviceRepository.save(s);
        return ResponseEntity.ok(toResponse(s));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();

        Service s = serviceRepository
                .findByIdForHost(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        if (!s.getCatalogue().getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de ce service");
        }

        if (StringUtils.hasText(s.getImageStoragePath())) {
            photoStorage.deleteStoredFile(s.getImageStoragePath());
        }

        Long catalogueId = s.getCatalogue().getId();
        catalogueServiceService.removeService(catalogueId, id, userId);
        return ResponseEntity.noContent().build();
    }

    private ServiceResponse toResponse(Service s) {
        return ServiceResponse.builder()
                .id(s.getId())
                .libelle(s.getLibelle())
                .description(s.getDescription())
                .categorie(s.getCategorie())
                .pricingType(s.getPricingType())
                .disponibilite(s.getDisponibilite())
                .prix(s.getPrix())
                .unite(s.getUnite())
                .conditionsUtilisation(s.getConditionsUtilisation())
                .actif(s.getActif())
                .imageUrl(photoUrlBuilder.toPublicUrl(s.getImageStoragePath()))
                .createdAt(s.getCreatedAt())
                .build();
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new com.quicklodge.exception.UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.quicklodge.exception.UnauthorizedException("Utilisateur introuvable"))
                .getId();
    }
}

