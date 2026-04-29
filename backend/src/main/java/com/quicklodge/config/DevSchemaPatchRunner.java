package com.quicklodge.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Dev-only patchs SQL pour adapter un schéma existant quand Hibernate (ddl-auto=update)
 * ne peut pas modifier certaines contraintes (NOT NULL, FK, etc.).
 */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.schema.patch.enabled", havingValue = "true", matchIfMissing = true)
public class DevSchemaPatchRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DevSchemaPatchRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public DevSchemaPatchRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        patchPaiementsForServiceOrders();
    }

    /**
     * Paiements: support des commandes de services (service_order_id) sans réservation.
     * Si reservation_id est encore NOT NULL, MySQL refuse l'insert lors d'un paiement lié à ServiceOrder.
     */
    private void patchPaiementsForServiceOrders() {
        tryExec("ALTER TABLE paiements MODIFY reservation_id BIGINT NULL");
        tryExec("ALTER TABLE paiements ADD COLUMN service_order_id BIGINT NULL");
        tryExec("CREATE INDEX idx_paiements_service_order_id ON paiements(service_order_id)");
        tryExec(
                "ALTER TABLE paiements " +
                        "ADD CONSTRAINT fk_paiements_service_order " +
                        "FOREIGN KEY (service_order_id) REFERENCES service_orders(id)"
        );
    }

    private void tryExec(String sql) {
        try {
            jdbcTemplate.execute(sql);
            log.debug("Dev schema patch applied: {}", sql);
        } catch (Exception e) {
            // Best-effort: déjà appliqué / permissions / version MySQL / contrainte existante, etc.
            log.debug("Dev schema patch skipped (ignored): {} ({})", sql, e.getMessage());
        }
    }
}

