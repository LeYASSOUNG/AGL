package com.quicklodge;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Garde le hash admin de {@code data.sql} aligné avec le mot de passe documenté dans le README
 * ({@code password}), même encodage BCrypt que l’app ({@link BCryptPasswordEncoder} strength 12).
 */
class BcryptSanityTest {

    /** Même valeur que {@code data.sql} (admin@quicklodge.com / password). */
    private static final String DATA_SQL_ADMIN_PASSWORD_HASH =
            "$2a$12$1tBEcIxPPxwm08KtZKnpruSdzTP7vpvRA.zCFgpQgJYZj.MZiPvN2";

    @Test
    void dataSqlAdminHashMatchesPassword() {
        var enc = new BCryptPasswordEncoder(12);
        Assertions.assertTrue(
                enc.matches("password", DATA_SQL_ADMIN_PASSWORD_HASH),
                "Synchroniser avec backend/src/main/resources/db/migration/data.sql");
    }
}
