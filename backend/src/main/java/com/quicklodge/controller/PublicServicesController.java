package com.quicklodge.controller;

import com.quicklodge.dto.response.service.PublicServiceListingResponse;
import com.quicklodge.entity.Service;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.ServiceRepository;
import com.quicklodge.util.EtablissementPhotoUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicServicesController {

    private final ServiceRepository serviceRepository;
    private final EtablissementPhotoUrlBuilder photoUrlBuilder;

    @GetMapping("/services")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PublicServiceListingResponse>> listPublicServices() {
        List<PublicServiceListingResponse> out = serviceRepository.findAllForPublicCatalog().stream()
                .map(this::toListing)
                .collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @GetMapping("/services/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PublicServiceListingResponse> getPublicService(@PathVariable Long id) {
        Service s = serviceRepository.findByIdForPublic(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
        return ResponseEntity.ok(toListing(s));
    }

    /**
     * Services globaux ajoutés par l'administrateur (non liés à un hébergement).
     * Ils peuvent être proposés en "extras" lors d'une réservation d'hébergement.
     */
    @GetMapping("/global-services")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PublicServiceListingResponse>> listGlobalServices() {
        List<PublicServiceListingResponse> out = serviceRepository.findAllGlobalActive().stream()
                .map(this::toGlobalListing)
                .collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    private PublicServiceListingResponse toListing(Service s) {
        var e = s.getCatalogue().getEtablissement();
        return PublicServiceListingResponse.builder()
                .id(s.getId())
                .libelle(s.getLibelle())
                .description(s.getDescription())
                .categorie(s.getCategorie())
                .pricingType(s.getPricingType())
                .disponibilite(s.getDisponibilite())
                .prix(s.getPrix())
                .unite(s.getUnite())
                .etablissementId(e.getId())
                .etablissementNom(e.getNom())
                .ville(e.getVille())
                .imageUrl(photoUrlBuilder.toPublicUrl(s.getImageStoragePath()))
                .build();
    }

    private PublicServiceListingResponse toGlobalListing(Service s) {
        return PublicServiceListingResponse.builder()
                .id(s.getId())
                .libelle(s.getLibelle())
                .description(s.getDescription())
                .categorie(s.getCategorie())
                .pricingType(s.getPricingType())
                .disponibilite(s.getDisponibilite())
                .prix(s.getPrix())
                .unite(s.getUnite())
                .etablissementId(null)
                .etablissementNom("Catalogue")
                .ville(null)
                .imageUrl(photoUrlBuilder.toPublicUrl(s.getImageStoragePath()))
                .build();
    }
}
