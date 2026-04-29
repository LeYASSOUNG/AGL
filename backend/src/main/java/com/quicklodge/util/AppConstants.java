package com.quicklodge.util;

/**
 * Constantes globales (JWT, en-têtes HTTP).
 */
public final class AppConstants {

    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String HEADER_STRING = HEADER_AUTHORIZATION;

    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_SUB = "sub";

    private AppConstants() {}
}
