package com.quicklodge.repository;

import com.quicklodge.entity.Chambre;
import com.quicklodge.entity.StatutChambre;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ChambreRepository extends JpaRepository<Chambre, Long> {

    List<Chambre> findByEtablissementId(Long etablissementId);

    @EntityGraph(attributePaths = {"photos", "typeChambre"})
    @Query("SELECT c FROM Chambre c WHERE c.etablissement.id = :etablissementId")
    List<Chambre> findByEtablissementIdWithPhotos(@Param("etablissementId") Long etablissementId);

    @EntityGraph(attributePaths = {"photos", "typeChambre", "etablissement"})
    @Query("SELECT c FROM Chambre c WHERE c.id = :id")
    Optional<Chambre> findDetailById(@Param("id") Long id);

    List<Chambre> findByStatut(StatutChambre statut);

    @Query("SELECT c FROM Chambre c JOIN c.disponibilites d WHERE c.etablissement.id = :etablissementId " +
            "AND c.statut = 'DISPONIBLE' AND d.statut = 'OUVERTE' " +
            "AND d.dateDebut <= :dateFin AND d.dateFin >= :dateDebut")
    List<Chambre> findDisponibles(@Param("etablissementId") Long etablissementId,
                                 @Param("dateDebut") LocalDate dateDebut,
                                 @Param("dateFin") LocalDate dateFin);
}
