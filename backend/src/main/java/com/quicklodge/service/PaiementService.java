package com.quicklodge.service;

import com.quicklodge.dto.request.paiement.CreatePaiementRequest;
import com.quicklodge.dto.response.paiement.PaiementResponse;

public interface PaiementService {

    PaiementResponse create(Long userId, CreatePaiementRequest request);
    PaiementResponse validate(Long paiementId, Long userId);
    PaiementResponse refund(Long paiementId, Long userId);
    PaiementResponse findById(Long id, Long userId);
}
