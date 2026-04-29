package com.quicklodge.repository;

import com.quicklodge.entity.CatalogueService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CatalogueServiceRepository extends JpaRepository<CatalogueService, Long> {

    Optional<CatalogueService> findByEtablissementId(Long etablissementId);

    /** Avec OIV off : établissement + propriétaire pour contrôle d’accès. */
    @Query(
            "SELECT c FROM CatalogueService c "
                    + "JOIN FETCH c.etablissement e "
                    + "JOIN FETCH e.proprietaire "
                    + "WHERE e.id = :etabId"
    )
    Optional<CatalogueService> findByEtablissementIdForHost(@Param("etabId") Long etablissementId);
}
