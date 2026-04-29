package com.quicklodge.repository;

import com.quicklodge.entity.CategorieService;
import com.quicklodge.entity.Service;
import com.quicklodge.entity.ServicePricingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServiceRepository extends JpaRepository<Service, Long> {

    /**
     * Pour contrôle d’accès côté hôte avec open-in-view désactivé : chargement de catalogue, établissement et
     * propriétaire en une requête.
     */
    @Query(
            "SELECT s FROM Service s "
                    + "JOIN FETCH s.catalogue c "
                    + "JOIN FETCH c.etablissement e "
                    + "JOIN FETCH e.proprietaire "
                    + "WHERE s.id = :id"
    )
    Optional<Service> findByIdForHost(@Param("id") Long id);

    List<Service> findByCatalogueId(Long catalogueId);

    List<Service> findByCategorie(CategorieService categorie);

    @Query(
            "SELECT s FROM Service s "
                    + "JOIN s.catalogue c "
                    + "JOIN c.etablissement e "
                    + "WHERE e.id = :etablissementId AND s.actif = true AND s.pricingType = :pricingType "
                    + "ORDER BY s.libelle"
    )
    List<Service> findActiveByEtablissementAndPricingType(
            @Param("etablissementId") Long etablissementId,
            @Param("pricingType") ServicePricingType pricingType);

    /**
     * Services actifs rattachés à un établissement actif (vitrine page Services publique).
     * Note : la recherche d’hébergements peut rester plus stricte (ex. validation admin) ; ici on évite
     * d’« effacer » les extras tant que l’établissement est publiable (actif).
     */
    @Query(
            "SELECT s FROM Service s "
                    + "JOIN FETCH s.catalogue c "
                    + "JOIN FETCH c.etablissement e "
                    + "WHERE s.actif = true AND e.actif = true "
                    + "ORDER BY COALESCE(e.ville, ''), e.nom, s.libelle")
    List<Service> findAllForPublicCatalog();

    @Query(
            "SELECT s FROM Service s "
                    + "JOIN FETCH s.catalogue c "
                    + "JOIN FETCH c.etablissement e "
                    + "WHERE s.id = :id AND s.actif = true AND e.actif = true"
    )
    Optional<Service> findByIdForPublic(@Param("id") Long id);

    /**
     * Services "catalogue admin" : actifs, non rattachés à un établissement (c.etablissement IS NULL).
     * Utilisés pour proposer des extras globaux (transport, restauration, etc.) lors d'une réservation.
     */
    @Query(
            "SELECT s FROM Service s "
                    + "JOIN FETCH s.catalogue c "
                    + "WHERE s.actif = true AND c.etablissement IS NULL "
                    + "ORDER BY s.libelle"
    )
    List<Service> findAllGlobalActive();
}
