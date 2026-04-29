package com.quicklodge.exception;

/**
 * Exception pour token JWT ou refresh expiré.
 */
public class TokenExpiredException extends RuntimeException {

    public TokenExpiredException(String message) {
        super(message);
    }
}
