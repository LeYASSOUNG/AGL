package com.quicklodge.service;

import com.quicklodge.dto.request.type.TypeChambreRequest;
import com.quicklodge.dto.response.type.TypeChambreResponse;

import java.util.List;

public interface TypeChambreService {
    List<TypeChambreResponse> getAllActifs();
    TypeChambreResponse create(TypeChambreRequest request);
    TypeChambreResponse update(Long id, TypeChambreRequest request);
    void toggleActif(Long id);
}

