package com.quicklodge.entity;

/**
 * Disponibilité d'un service côté voyageur.
 * - PERMANENT : disponible en continu
 * - ON_REQUEST : sur demande / réservation préalable
 * - SEASONAL : saisonnier (ex. piscine selon période)
 */
public enum ServiceAvailability {
    PERMANENT,
    ON_REQUEST,
    SEASONAL
}

