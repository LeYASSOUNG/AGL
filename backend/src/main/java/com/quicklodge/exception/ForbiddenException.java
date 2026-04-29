package com.quicklodge.exception;

/**
 * Exception 403 — accès refusé (rôle insuffisant).
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
