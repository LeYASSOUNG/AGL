package com.quicklodge.exception;

/**
 * Exception 409 — conflit (ex. email déjà utilisé, réservation en double).
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
