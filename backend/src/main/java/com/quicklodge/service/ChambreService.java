package com.quicklodge.service;

import com.quicklodge.dto.request.chambre.CreateChambreRequest;
import com.quicklodge.dto.request.chambre.UpdateChambreRequest;
import com.quicklodge.dto.response.chambre.ChambreResponse;

import java.time.LocalDate;
import java.util.List;

public interface ChambreService {

    ChambreResponse create(Long userId, CreateChambreRequest request);
    ChambreResponse update(Long chambreId, Long userId, UpdateChambreRequest request);
    void delete(Long chambreId, Long userId);
    List<ChambreResponse> findByEtablissement(Long etablissementId);
    boolean checkDisponibilite(Long chambreId, LocalDate dateDebut, LocalDate dateFin);
}
