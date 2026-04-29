package com.quicklodge.exception;

/**
 * Exception 401 — non authentifié (token absent ou invalide).
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
