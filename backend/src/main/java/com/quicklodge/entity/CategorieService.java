package com.quicklodge.entity;

/**
 * Catégorie d’un service du catalogue hôtelier.
 *
 * Les 8 premières valeurs correspondent aux familles principales (type Airbnb).
 * Les valeurs legacy restent pour la compatibilité des données déjà enregistrées.
 */
public enum CategorieService {
    HEBERGEMENT_BASE,
    RESTAURATION,
    BIEN_ETRE_LOISIRS,
    TRANSPORT,
    PROFESSIONNEL,
    CONCIERGERIE,
    FAMILLE,
    SERVICES_ADDITIONNELS,

    PETIT_DEJEUNER,
    MENAGE,
    PARKING,
    WIFI,
    ANIMAUX,
    CLIMATISATION,
    AUTRE
}
