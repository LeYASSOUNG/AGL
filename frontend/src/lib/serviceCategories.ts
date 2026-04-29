/**
 * Référentiel des catégories de services (aligné sur {@code com.quicklodge.entity.CategorieService} côté API).
 * Les libellés FR sont utilisés dans la vitrine et l’espace hôte.
 */

export const SERVICE_CATEGORY_ORDER = [
  'HEBERGEMENT_BASE',
  'RESTAURATION',
  'BIEN_ETRE_LOISIRS',
  'TRANSPORT',
  'PROFESSIONNEL',
  'CONCIERGERIE',
  'FAMILLE',
  'SERVICES_ADDITIONNELS',
  // legacy / compat
  'PETIT_DEJEUNER',
  'MENAGE',
  'PARKING',
  'WIFI',
  'ANIMAUX',
  'CLIMATISATION',
  'AUTRE',
] as const;

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  HEBERGEMENT_BASE: 'Hébergement de base (séjour)',
  RESTAURATION: 'Restauration',
  BIEN_ETRE_LOISIRS: 'Bien-être et loisirs',
  TRANSPORT: 'Transport',
  PROFESSIONNEL: 'Services professionnels',
  CONCIERGERIE: 'Conciergerie',
  FAMILLE: 'Familles',
  SERVICES_ADDITIONNELS: 'Services additionnels',
  // legacy / compat
  PETIT_DEJEUNER: 'Petit-déjeuner',
  MENAGE: 'Ménage / entretien',
  PARKING: 'Parking',
  WIFI: 'Wi‑Fi',
  ANIMAUX: 'Animaux',
  CLIMATISATION: 'Climatisation',
  AUTRE: 'Autre',
};

/** Modèles de libellés proposés à l’hôte (le libellé exact reste libre en base). */
export const SERVICE_CATALOG_SUGGESTIONS: Record<string, string[]> = {
  HEBERGEMENT_BASE: [
    'Petit-déjeuner (continental, buffet, américain)',
    'Demi-pension (petit-déjeuner + dîner)',
    'Pension complète (tous les repas)',
    'Nettoyage quotidien de chambre',
    'Changement de draps et serviettes',
  ],
  RESTAURATION: [
    'Restaurant sur place',
    'Room service (service en chambre)',
    'Bar / cafétéria',
    'Mini-bar dans la chambre',
    'Service traiteur pour événements',
  ],
  BIEN_ETRE_LOISIRS: [
    'Piscine (intérieure / extérieure)',
    'Spa et centre de bien-être',
    'Salle de fitness / gym',
    'Sauna et hammam',
    'Massage et soins corporels',
    'Salon de beauté',
  ],
  TRANSPORT: [
    'Navette aéroport',
    'Service de taxi / VTC',
    'Location de véhicules',
    'Parking (gratuit ou payant)',
    'Service de voiturier',
  ],
  PROFESSIONNEL: [
    'Salles de conférence / réunion',
    'Équipement audiovisuel',
    'Wi‑Fi haut débit',
    'Business center',
    'Service de secrétariat',
  ],
  CONCIERGERIE: [
    'Réservation de restaurants',
    'Billetterie (spectacles, événements)',
    'Organisation d’excursions touristiques',
    'Conseil et information touristique',
    'Service de bagagerie',
  ],
  FAMILLE: [
    'Garderie / club enfants',
    'Animations pour enfants',
    'Lit bébé',
    'Menu enfant',
    'Aire de jeux',
  ],
  SERVICES_ADDITIONNELS: [
    'Blanchisserie / pressing',
    'Coffre-fort',
    'Animaux acceptés',
    'Accès handicapés',
    'Service médical / infirmerie',
    'Boutique / kiosque',
  ],
};

export function serviceCategoryLabel(code: string | undefined): string {
  if (!code) return '';
  const k = code.trim().toUpperCase();
  return SERVICE_CATEGORY_LABELS[k] ?? code.replaceAll('_', ' ').toLowerCase();
}

const ALL_CATEGORY_CODES = new Set<string>(SERVICE_CATEGORY_ORDER as readonly string[]);

/** Valeur sûre pour un `<select>` (évite une valeur inconnue renvoyée par l’API). */
export function normalizeServiceCategory(raw: string | undefined, fallback = 'AUTRE'): string {
  if (!raw?.trim()) return fallback;
  const up = raw.trim().toUpperCase();
  return ALL_CATEGORY_CODES.has(up) ? up : fallback;
}

