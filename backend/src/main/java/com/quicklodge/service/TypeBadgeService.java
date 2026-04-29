package com.quicklodge.service;

import com.quicklodge.dto.request.type.TypeBadgeRequest;
import com.quicklodge.dto.response.type.TypeBadgeResponse;

import java.util.List;

public interface TypeBadgeService {

    List<TypeBadgeResponse> getAllActifs();

    TypeBadgeResponse create(TypeBadgeRequest request);

    TypeBadgeResponse update(Long id, TypeBadgeRequest request);

    void toggleActif(Long id);
}
