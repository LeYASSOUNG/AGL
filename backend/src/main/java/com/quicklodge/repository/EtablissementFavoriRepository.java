package com.quicklodge.repository;

import com.quicklodge.entity.EtablissementFavori;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EtablissementFavoriRepository extends JpaRepository<EtablissementFavori, Long> {

    Optional<EtablissementFavori> findByUserIdAndEtablissementId(Long userId, Long etablissementId);

    boolean existsByUserIdAndEtablissementId(Long userId, Long etablissementId);

    long countByEtablissementId(Long etablissementId);

    @Query("SELECT f.etablissement.id FROM EtablissementFavori f WHERE f.user.id = :userId")
    List<Long> findEtablissementIdsByUserId(@Param("userId") Long userId);
}

