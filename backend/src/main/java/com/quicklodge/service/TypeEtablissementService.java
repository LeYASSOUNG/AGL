package com.quicklodge.service;

import com.quicklodge.dto.request.type.TypeEtablissementRequest;
import com.quicklodge.dto.response.type.TypeEtablissementResponse;

import java.util.List;

public interface TypeEtablissementService {
    List<TypeEtablissementResponse> getAllActifs();
    TypeEtablissementResponse create(TypeEtablissementRequest request);
    TypeEtablissementResponse update(Long id, TypeEtablissementRequest request);
    void toggleActif(Long id);
}

