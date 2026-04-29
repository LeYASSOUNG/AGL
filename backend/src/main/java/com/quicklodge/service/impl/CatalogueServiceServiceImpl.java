package com.quicklodge.service.impl;

import com.quicklodge.entity.CatalogueService;
import com.quicklodge.entity.Etablissement;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.CatalogueServiceRepository;
import com.quicklodge.repository.EtablissementRepository;
import com.quicklodge.repository.ServiceRepository;
import com.quicklodge.service.CatalogueServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class CatalogueServiceServiceImpl implements CatalogueServiceService {

    private final CatalogueServiceRepository catalogueServiceRepository;
    private final EtablissementRepository etablissementRepository;
    private final ServiceRepository serviceRepository;

    @Override
    @Transactional
    public CatalogueService create(Long etablissementId, Long userId, String libelle) {
        Etablissement e = etablissementRepository.findById(etablissementId)
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", etablissementId));
        if (!e.getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        if (catalogueServiceRepository.findByEtablissementId(etablissementId).isPresent()) {
            throw new ForbiddenException("Un catalogue existe déjà pour cet établissement");
        }
        CatalogueService cs = CatalogueService.builder()
                .libelle(libelle != null ? libelle : "Catalogue")
                .etablissement(e)
                .build();
        cs = catalogueServiceRepository.save(cs);
        e.setCatalogueService(cs);
        etablissementRepository.save(e);
        return cs;
    }

    @Override
    @Transactional
    public CatalogueService update(Long catalogueId, Long userId, String libelle) {
        CatalogueService cs = catalogueServiceRepository.findById(catalogueId)
                .orElseThrow(() -> new ResourceNotFoundException("CatalogueService", "id", catalogueId));
        if (!cs.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        if (libelle != null) cs.setLibelle(libelle);
        return catalogueServiceRepository.save(cs);
    }

    @Override
    @Transactional
    public void addService(Long catalogueId, Long userId, com.quicklodge.entity.Service service) {
        CatalogueService cs = catalogueServiceRepository.findById(catalogueId)
                .orElseThrow(() -> new ResourceNotFoundException("CatalogueService", "id", catalogueId));
        if (!cs.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        service.setCatalogue(cs);
        serviceRepository.save(service);
    }

    @Override
    @Transactional
    public void removeService(Long catalogueId, Long serviceId, Long userId) {
        CatalogueService cs = catalogueServiceRepository.findById(catalogueId)
                .orElseThrow(() -> new ResourceNotFoundException("CatalogueService", "id", catalogueId));
        com.quicklodge.entity.Service s = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        if (!cs.getEtablissement().getProprietaire().getId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas le propriétaire de cet établissement");
        }
        if (!s.getCatalogue().getId().equals(catalogueId)) {
            throw new ForbiddenException("Ce service n'appartient pas à ce catalogue");
        }
        cs.getServices().remove(s);
        serviceRepository.delete(s);
    }

    @Override
    @Transactional(readOnly = true)
    public CatalogueService findByEtablissementId(Long etablissementId) {
        return catalogueServiceRepository.findByEtablissementId(etablissementId).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public CatalogueService findByEtablissementIdForHost(Long etablissementId) {
        return catalogueServiceRepository.findByEtablissementIdForHost(etablissementId).orElse(null);
    }
}
