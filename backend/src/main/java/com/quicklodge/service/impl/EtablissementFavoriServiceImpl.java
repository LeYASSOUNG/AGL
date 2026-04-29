package com.quicklodge.service.impl;

import com.quicklodge.dto.response.etablissement.FavoriToggleResponse;
import com.quicklodge.entity.Etablissement;
import com.quicklodge.entity.EtablissementFavori;
import com.quicklodge.entity.User;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.EtablissementFavoriRepository;
import com.quicklodge.repository.EtablissementRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.EtablissementFavoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EtablissementFavoriServiceImpl implements EtablissementFavoriService {

    private final EtablissementFavoriRepository favoriRepository;
    private final EtablissementRepository etablissementRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FavoriToggleResponse toggleFavori(Long userId, Long etablissementId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Etablissement e = etablissementRepository.findById(etablissementId)
                .orElseThrow(() -> new ResourceNotFoundException("Etablissement", "id", etablissementId));

        boolean nowFavori;
        int nextCount;

        EtablissementFavori existing = favoriRepository.findByUserIdAndEtablissementId(userId, etablissementId).orElse(null);
        Integer current = e.getFavorisCount() != null ? e.getFavorisCount() : 0;

        if (existing != null) {
            favoriRepository.delete(existing);
            nowFavori = false;
            nextCount = Math.max(0, current - 1);
        } else {
            favoriRepository.save(EtablissementFavori.builder().user(user).etablissement(e).build());
            nowFavori = true;
            nextCount = current + 1;
        }

        e.setFavorisCount(nextCount);
        etablissementRepository.save(e);

        return FavoriToggleResponse.builder()
                .etablissementId(etablissementId)
                .favori(nowFavori)
                .favorisCount(nextCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> listFavorisByUser(Long userId) {
        return favoriRepository.findEtablissementIdsByUserId(userId);
    }
}

