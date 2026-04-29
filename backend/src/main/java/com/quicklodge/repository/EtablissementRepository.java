package com.quicklodge.repository;

import com.quicklodge.entity.Etablissement;
import com.quicklodge.entity.TypeEtablissement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EtablissementRepository extends JpaRepository<Etablissement, Long> {

    List<Etablissement> findByProprietaireId(Long userId);

    long countByProprietaireId(Long userId);

    /**
     * Un seul « bag » join-fetch à la fois sur {@link Etablissement} : {@code photos} et {@code chambres}
     * sont toutes deux des {@code List} → {@code MultipleBagFetchException} si elles sont dans le même graphe.
     * On charge {@code chambres} + {@code typeChambre} ici ; les photos d’établissement sont résolues en lazy
     * avec {@code @BatchSize} sur {@link com.quicklodge.entity.Etablissement#getPhotos()}. Les photos des
     * chambres via {@code @BatchSize} sur {@link com.quicklodge.entity.Chambre#getPhotos()}.
     */
    @EntityGraph(attributePaths = {"typeEtablissement", "chambres", "chambres.typeChambre"})
    @Query("SELECT e FROM Etablissement e WHERE e.id = :id")
    Optional<Etablissement> findDetailById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"photos", "typeEtablissement"})
    @Query("SELECT e FROM Etablissement e WHERE e.proprietaire.id = :userId")
    List<Etablissement> findByProprietaireIdWithPhotos(@Param("userId") Long userId);

    List<Etablissement> findByVille(String ville);

    List<Etablissement> findByTypeEtablissement(TypeEtablissement type);

    @EntityGraph(attributePaths = {"typeEtablissement", "proprietaire", "photos"})
    List<Etablissement> findByValideAdminIsFalseAndActifIsTrueOrderByCreatedAtDesc();

    /**
     * Liste admin : charge en une fois type, propriétaire et photos pour éviter
     * {@link org.hibernate.LazyInitializationException} hors session lors du mapping.
     */
    @EntityGraph(attributePaths = {"typeEtablissement", "proprietaire", "photos"})
    @Query("SELECT e FROM Etablissement e ORDER BY e.createdAt DESC")
    List<Etablissement> findAllWithAdminAssociations();

    long countByValideAdminIsFalseAndActifIsTrue();

    /** Actifs + validés admin = visibles dans la recherche publique (filtres dates/voyageurs en sus). */
    long countByActifTrueAndValideAdminTrue();

    /** Destinations publiques : villes distinctes des établissements visibles. */
    @Query("SELECT DISTINCT e.ville FROM Etablissement e " +
            "WHERE e.actif = true AND (e.valideAdmin = true OR :includeUnvalidated = true) " +
            "AND e.ville IS NOT NULL AND TRIM(e.ville) <> '' " +
            "ORDER BY e.ville ASC")
    List<String> findDistinctPublicVilles(@Param("includeUnvalidated") boolean includeUnvalidated);

    @Query("SELECT e FROM Etablissement e WHERE e.actif = true AND (e.valideAdmin = true OR :includeUnvalidated = true) " +
            "AND (:ville IS NULL OR e.ville = :ville) " +
            "AND (:typeId IS NULL OR e.typeEtablissement.id = :typeId) " +
            "AND (:keyword IS NULL OR LOWER(e.nom) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(COALESCE(e.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(COALESCE(e.ville, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(COALESCE(e.adresse, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND ((:dateDebut IS NULL OR :dateFin IS NULL) OR EXISTS (" +
            "    SELECT 1 FROM Chambre c WHERE c.etablissement = e AND c.statut = 'DISPONIBLE' " +
            "    AND (:minVoyageurs IS NULL OR c.capacitePersonnes IS NULL OR c.capacitePersonnes >= :minVoyageurs) " +
            "    AND NOT EXISTS (" +
            "        SELECT 1 FROM Reservation r JOIN r.chambres rc WHERE rc.id = c.id " +
            "        AND r.statut NOT IN ('ANNULEE', 'TERMINEE') " +
            "        AND r.dateDebut <= :dateFin AND r.dateFin >= :dateDebut" +
            "    )" +
            "))")
    Page<Etablissement> search(
            @Param("ville") String ville,
            @Param("typeId") Long typeId,
            @Param("keyword") String keyword,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin,
            @Param("minVoyageurs") Integer minVoyageurs,
            @Param("includeUnvalidated") boolean includeUnvalidated,
            Pageable pageable);
}
