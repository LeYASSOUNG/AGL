package com.quicklodge.exception;

/**
 * Exception 400 — requête invalide (données manquantes, format incorrect).
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
