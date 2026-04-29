package com.quicklodge.service;

import com.quicklodge.dto.response.etablissement.FavoriToggleResponse;

import java.util.List;

public interface EtablissementFavoriService {
    FavoriToggleResponse toggleFavori(Long userId, Long etablissementId);
    List<Long> listFavorisByUser(Long userId);
}

