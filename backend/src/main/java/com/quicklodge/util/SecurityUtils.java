package com.quicklodge.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Accès au principal (email) depuis le SecurityContext.
 */
public final class SecurityUtils {

    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && auth.getPrincipal() != null
                ? auth.getName()
                : null;
    }

    private SecurityUtils() {}
}
