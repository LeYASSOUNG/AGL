package com.quicklodge.service;

import com.quicklodge.dto.request.etablissement.CreateEtablissementRequest;
import com.quicklodge.dto.request.etablissement.UpdateEtablissementRequest;
import com.quicklodge.dto.response.common.PageResponse;
import com.quicklodge.dto.response.etablissement.EtablissementDetailResponse;
import com.quicklodge.dto.response.etablissement.EtablissementResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface EtablissementService {

    EtablissementResponse create(Long userId, CreateEtablissementRequest request);
    EtablissementResponse update(Long etablissementId, Long userId, UpdateEtablissementRequest request);
    void delete(Long etablissementId, Long userId);
    EtablissementDetailResponse findById(Long id);
    PageResponse<EtablissementResponse> search(
            String ville,
            Long typeEtablissementId,
            String keyword,
            LocalDate dateDebut,
            LocalDate dateFin,
            Integer nombreVoyageurs,
            Pageable pageable);
    List<EtablissementResponse> findByHote(Long userId);

    /** Villes distinctes des établissements publics (actifs + validés). */
    List<String> listPublicVilles();
}
