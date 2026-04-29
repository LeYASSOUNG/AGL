package com.quicklodge.repository;

import com.quicklodge.entity.Avis;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AvisRepository extends JpaRepository<Avis, Long> {

    @EntityGraph(attributePaths = {"auteur", "etablissement", "reservation"})
    @Query("SELECT a FROM Avis a ORDER BY a.createdAt DESC")
    List<Avis> findAllForAdminOrderByCreatedAtDesc();

    List<Avis> findByEtablissementId(Long etablissementId);

    List<Avis> findByAuteurId(Long auteurId);

    Optional<Avis> findByReservationId(Long reservationId);

    @Query("SELECT AVG(a.note) FROM Avis a WHERE a.etablissement.id = :etablissementId")
    Double calculateMoyenneNote(@Param("etablissementId") Long etablissementId);

    @Query("SELECT AVG(a.note) FROM Avis a WHERE a.etablissement.proprietaire.id = :proprietaireId")
    Double averageNoteForHost(@Param("proprietaireId") Long proprietaireId);
}
