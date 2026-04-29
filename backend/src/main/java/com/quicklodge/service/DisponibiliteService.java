package com.quicklodge.service;

import com.quicklodge.dto.request.disponibilite.CreateDisponibiliteRequest;
import com.quicklodge.dto.response.disponibilite.DisponibiliteResponse;

import java.util.List;

public interface DisponibiliteService {

    DisponibiliteResponse create(Long userId, CreateDisponibiliteRequest request);
    DisponibiliteResponse block(Long disponibiliteId, Long userId);
    DisponibiliteResponse free(Long disponibiliteId, Long userId);
    List<DisponibiliteResponse> findByChambre(Long chambreId);
}
