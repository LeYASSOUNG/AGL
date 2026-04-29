package com.quicklodge.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Nettoyage DEV des données qui peuvent générer des doublons visibles côté frontend.
 * Objectif demandé: garder les services liés aux établissements et supprimer les doublons "catalogue admin"
 * (catalogue_services.etablissement_id IS NULL), uniquement si non référencés par une réservation/commande.
 */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.data.cleanup.enabled", havingValue = "true", matchIfMissing = false)
public class DevDataCleanupRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DevDataCleanupRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final Environment env;

    public DevDataCleanupRunner(JdbcTemplate jdbcTemplate, Environment env) {
        this.jdbcTemplate = jdbcTemplate;
        this.env = env;
    }

    @Override
    public void run(ApplicationArguments args) {
        int deletedServices = deleteUnlinkedServicesNotReferenced();
        int deletedCatalogues = deleteEmptyUnlinkedCatalogues();
        log.info("Dev cleanup: deleted {} unlinked service(s), {} empty unlinked catalogue(s).", deletedServices, deletedCatalogues);

        if (Boolean.parseBoolean(env.getProperty("app.data.cleanup.dedupe-services.enabled", "false"))) {
            int removed = deleteDuplicateServicesWithinEtablissements();
            log.info("Dev cleanup: removed {} duplicate service(s) within establishments.", removed);
        }

        if (Boolean.parseBoolean(env.getProperty("app.data.cleanup.keep-only-two-per-category.enabled", "false"))) {
            int removed = pruneServicesToTwoPerCategory();
            log.info("Dev cleanup: removed {} service(s) to keep only 2 per category.", removed);
        }

        if (Boolean.parseBoolean(env.getProperty("app.data.cleanup.delete-reservations.enabled", "false"))) {
            int deletedReservations = deletePastAndInProgressReservations();
            log.info("Dev cleanup: deleted {} reservation(s) (past + in progress).", deletedReservations);

            // One-shot safety: on laisse une trace claire dans les logs pour rappeler de remettre le flag à false.
            log.warn("Dev cleanup one-shot: pensez à remettre app.data.cleanup.delete-reservations.enabled=false après ce démarrage.");
        }
    }

    /**
     * Supprime les services dont le catalogue n'est lié à aucun établissement (admin catalogue),
     * uniquement si le service n'est pas référencé par reservation_service_lines ou service_order_lines.
     */
    private int deleteUnlinkedServicesNotReferenced() {
        String sql =
                "DELETE s " +
                        "FROM services s " +
                        "JOIN catalogue_services c ON c.id = s.catalogue_id " +
                        "WHERE c.etablissement_id IS NULL " +
                        "  AND NOT EXISTS (SELECT 1 FROM reservation_service_lines rsl WHERE rsl.service_id = s.id) " +
                        "  AND NOT EXISTS (SELECT 1 FROM service_order_lines sol WHERE sol.service_id = s.id)";
        try {
            return jdbcTemplate.update(sql);
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (services): {}", e.getMessage());
            return 0;
        }
    }

    /** Supprime les catalogues admin vides (etablissement_id NULL) après suppression des services. */
    private int deleteEmptyUnlinkedCatalogues() {
        String sql =
                "DELETE c " +
                        "FROM catalogue_services c " +
                        "LEFT JOIN services s ON s.catalogue_id = c.id " +
                        "WHERE c.etablissement_id IS NULL " +
                        "  AND s.id IS NULL";
        try {
            return jdbcTemplate.update(sql);
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (catalogues): {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Supprime toutes les réservations "passées" (date_fin < CURDATE()) et "en cours" (statut = 'EN_COURS'),
     * ainsi que leurs dépendances, pour éviter les violations de contraintes.
     */
    private int deletePastAndInProgressReservations() {
        // Condition commune (réutilisée dans plusieurs requêtes).
        String where =
                "reservation_id IN (SELECT id FROM reservations WHERE date_fin < CURDATE() OR statut = 'EN_COURS')";

        // 1) Avis (FK reservation_id non-null)
        try {
            jdbcTemplate.update("DELETE FROM avis WHERE " + where);
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (avis): {}", e.getMessage());
        }

        // 2) Paiements liés aux réservations
        try {
            jdbcTemplate.update("DELETE FROM paiements WHERE " + where);
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (paiements): {}", e.getMessage());
        }

        // 3) Lignes de services
        try {
            jdbcTemplate.update("DELETE FROM reservation_service_lines WHERE " + where);
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (reservation_service_lines): {}", e.getMessage());
        }

        // 4) Jointure chambres
        try {
            jdbcTemplate.update("DELETE FROM reservation_chambres WHERE " + where);
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (reservation_chambres): {}", e.getMessage());
        }

        // 5) Réservations
        try {
            return jdbcTemplate.update("DELETE FROM reservations WHERE date_fin < CURDATE() OR statut = 'EN_COURS'");
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (reservations): {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Supprime les doublons de services affichés deux fois sur la page publique "Services".
     * Critère: même établissement (via catalogue), même catégorie, même libellé (trim + lower).
     * Conserve le plus petit id (le "premier") et supprime les autres uniquement s'ils ne sont pas référencés.
     */
    private int deleteDuplicateServicesWithinEtablissements() {
        String sql =
                "DELETE s " +
                        "FROM services s " +
                        "JOIN catalogue_services c ON c.id = s.catalogue_id " +
                        "JOIN etablissements e ON e.id = c.etablissement_id " +
                        "JOIN services keepS ON keepS.catalogue_id = s.catalogue_id " +
                        "  AND keepS.categorie = s.categorie " +
                        "  AND LOWER(TRIM(keepS.libelle)) = LOWER(TRIM(s.libelle)) " +
                        "  AND keepS.id < s.id " +
                        "WHERE e.id IS NOT NULL " +
                        "  AND NOT EXISTS (SELECT 1 FROM reservation_service_lines rsl WHERE rsl.service_id = s.id) " +
                        "  AND NOT EXISTS (SELECT 1 FROM service_order_lines sol WHERE sol.service_id = s.id)";
        try {
            return jdbcTemplate.update(sql);
        } catch (Exception ex) {
            log.warn("Dev cleanup skipped (dedupe services): {}", ex.getMessage());
            return 0;
        }
    }

    /**
     * Garde uniquement 2 services par catégorie (sur l'ensemble des services liés à des établissements),
     * et supprime le reste (si non référencé).
     *
     * Motivation: éviter d'avoir trop de services dans une même section de la page Services en dev.
     */
    private int pruneServicesToTwoPerCategory() {
        // 1) Récupère toutes les catégories existantes depuis les lignes en base (évite de dépendre d'un enum ici).
        List<String> categories;
        try {
            categories = jdbcTemplate.queryForList(
                    "SELECT DISTINCT categorie FROM services WHERE categorie IS NOT NULL",
                    String.class
            );
        } catch (Exception e) {
            log.warn("Dev cleanup skipped (prune categories): {}", e.getMessage());
            return 0;
        }

        int removed = 0;
        for (String cat : categories) {
            if (cat == null || cat.isBlank()) continue;

            // 2) Liste des IDs liés à un établissement pour cette catégorie.
            List<Long> ids = new ArrayList<>();
            try {
                ids = jdbcTemplate.queryForList(
                        "SELECT s.id " +
                                "FROM services s " +
                                "JOIN catalogue_services c ON c.id = s.catalogue_id " +
                                "WHERE c.etablissement_id IS NOT NULL AND s.categorie = ? " +
                                "ORDER BY s.id ASC",
                        Long.class,
                        cat
                );
            } catch (Exception e) {
                log.warn("Dev cleanup skipped (prune fetch ids for {}): {}", cat, e.getMessage());
                continue;
            }

            if (ids.size() <= 2) continue;
            List<Long> toDelete = ids.subList(2, ids.size());
            for (Long id : toDelete) {
                if (id == null) continue;
                // Supprime seulement si non référencé (réservations / commandes).
                try {
                    int n = jdbcTemplate.update(
                            "DELETE FROM services " +
                                    "WHERE id = ? " +
                                    "  AND NOT EXISTS (SELECT 1 FROM reservation_service_lines rsl WHERE rsl.service_id = services.id) " +
                                    "  AND NOT EXISTS (SELECT 1 FROM service_order_lines sol WHERE sol.service_id = services.id)",
                            id
                    );
                    removed += n;
                } catch (Exception e) {
                    log.warn("Dev cleanup skipped (prune delete service {}): {}", id, e.getMessage());
                }
            }
        }
        return removed;
    }
}

