package com.quicklodge.service;

import com.quicklodge.dto.request.avis.CreateAvisRequest;
import com.quicklodge.dto.response.avis.AvisResponse;

import java.util.List;

public interface AvisService {

    AvisResponse create(Long userId, CreateAvisRequest request);
    AvisResponse update(Long avisId, Long userId, String reponseHote);
    void delete(Long avisId, Long userId);
    List<AvisResponse> findByEtablissement(Long etablissementId);
    List<AvisResponse> findByAuteur(Long auteurId);
}
