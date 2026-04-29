package com.quicklodge.service;

import com.quicklodge.entity.CatalogueService;
import com.quicklodge.entity.Service;

/**
 * Service métier pour l'entité CatalogueService (catalogue de services d'un établissement).
 */
public interface CatalogueServiceService {

    CatalogueService create(Long etablissementId, Long userId, String libelle);
    CatalogueService update(Long catalogueId, Long userId, String libelle);
    void addService(Long catalogueId, Long userId, Service service);
    void removeService(Long catalogueId, Long serviceId, Long userId);
    CatalogueService findByEtablissementId(Long etablissementId);

    /**
     * Catalogue de l’établissement avec relations nécessaires au contrôle d’accès
     * (JPA, open-in-view désactivé).
     */
    CatalogueService findByEtablissementIdForHost(Long etablissementId);
}
