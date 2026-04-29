package com.quicklodge.config;

import com.quicklodge.entity.*;
import com.quicklodge.repository.CatalogueServiceRepository;
import com.quicklodge.repository.EtablissementRepository;
import com.quicklodge.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * DEV: garantit qu'il existe au moins 2 services actifs par catégorie (liés à des établissements),
 * pour que la page "Services" affiche toujours au moins deux cartes par type.
 *
 * Idempotent: ne crée que les services manquants.
 */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.seed.ensure-two-services-per-category.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class DevEnsureTwoServicesPerCategoryRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DevEnsureTwoServicesPerCategoryRunner.class);

    private final EtablissementRepository etablissementRepository;
    private final CatalogueServiceRepository catalogueServiceRepository;
    private final ServiceRepository serviceRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Optional<Etablissement> maybeTarget = etablissementRepository.findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getActif()))
                .min(Comparator.comparing(Etablissement::getId));
        if (maybeTarget.isEmpty()) {
            return;
        }
        Etablissement target = maybeTarget.get();
        CatalogueService catalogue = catalogueServiceRepository.findByEtablissementId(target.getId())
                .orElseGet(() -> catalogueServiceRepository.save(CatalogueService.builder()
                        .libelle(("Catalogue " + target.getNom()).trim())
                        .etablissement(target)
                        .build()));

        int created = 0;
        for (CategorieService cat : CategorieService.values()) {
            long count = countActiveServicesLinkedToEtablissements(cat);
            int missing = (int) Math.max(0, 2 - count);
            for (int i = 0; i < missing; i++) {
                created += (createServiceForCategoryIfAbsent(catalogue, cat, i + 1) ? 1 : 0);
            }
        }
        if (created > 0) {
            log.info("Dev seed: created {} service(s) to ensure >=2 per category.", created);
        }
    }

    private long countActiveServicesLinkedToEtablissements(CategorieService cat) {
        // On compte uniquement les services dont le catalogue est lié à un établissement (etablissement_id NOT NULL)
        // pour respecter la demande "laisser les services liés aux établissements".
        return serviceRepository.findAll().stream()
                .filter(s -> s != null
                        && Boolean.TRUE.equals(s.getActif())
                        && s.getCategorie() == cat
                        && s.getCatalogue() != null
                        && s.getCatalogue().getEtablissement() != null
                        && Boolean.TRUE.equals(s.getCatalogue().getEtablissement().getActif()))
                .count();
    }

    private boolean createServiceForCategoryIfAbsent(CatalogueService catalogue, CategorieService cat, int idx) {
        String base = labelFor(cat);
        String libelle = (base + " " + idx).trim();

        boolean exists = catalogue.getServices() != null && catalogue.getServices().stream()
                .anyMatch(s -> s != null
                        && s.getCategorie() == cat
                        && s.getLibelle() != null
                        && s.getLibelle().trim().equalsIgnoreCase(libelle));
        if (exists) return false;

        com.quicklodge.entity.Service s = com.quicklodge.entity.Service.builder()
                .catalogue(catalogue)
                .libelle(libelle)
                .description("Service de démonstration (dev).")
                .categorie(cat)
                .pricingType(ServicePricingType.PAID)
                .disponibilite(ServiceAvailability.PERMANENT)
                .prix(BigDecimal.valueOf(1000 + (idx * 500L)))
                .unite("prestation")
                .conditionsUtilisation(null)
                .actif(true)
                .build();
        serviceRepository.save(s);
        return true;
    }

    private static String labelFor(CategorieService cat) {
        // Labels simples et lisibles côté UI (grouping par catégorie).
        return switch (cat) {
            case HEBERGEMENT_BASE -> "Service de base";
            case RESTAURATION -> "Restauration";
            case BIEN_ETRE_LOISIRS -> "Bien-être & loisirs";
            case TRANSPORT -> "Transport";
            case PROFESSIONNEL -> "Business";
            case CONCIERGERIE -> "Conciergerie";
            case FAMILLE -> "Famille";
            case SERVICES_ADDITIONNELS -> "Service additionnel";
            case PETIT_DEJEUNER -> "Petit-déjeuner";
            case MENAGE -> "Ménage";
            case PARKING -> "Parking";
            case WIFI -> "Wi‑Fi";
            case ANIMAUX -> "Animaux";
            case CLIMATISATION -> "Climatisation";
            case AUTRE -> "Autre service";
        };
    }
}

