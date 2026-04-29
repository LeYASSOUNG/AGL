export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type BackendEtablissement = {
  id: number;
  typeEtablissementId?: number | null;
  typeEtablissementLibelle?: string | null;
  /** URLs servies par l’API (/api/files/...) */
  photoUrls?: string[] | null;
  nom: string;
  description: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
  latitude: number | null;
  longitude: number | null;
  actif: boolean;
  /** Si false, l’hébergement n’apparaît pas dans la recherche publique tant que l’admin n’a pas validé. */
  valideAdmin?: boolean;
  /** Nombre de favoris (cœurs) attribués par les utilisateurs. */
  favorisCount?: number | null;
  proprietaireId: number;
  createdAt: string;
  // legacy/compat
  typeEtablissement?: string;
};

export type BackendChambre = {
  id: number;
  nom: string;
  /** Nom choisi par l’hôte (affichage voyageur), sinon utiliser {@link nom}. */
  nomPersonnalise?: string | null;
  prixNuit: number;
  capacitePersonnes: number;
  typeChambreId?: number;
  typeChambreLibelle?: string | null;
  statut?: string;
  etablissementId?: number;
  /** URLs servies par l’API (/api/files/...) */
  photoUrls?: string[] | null;
};

export type BackendEtablissementDetail = {
  id: number;
  nom: string;
  description: string;
  adresse: string;
  ville: string;
  chambres: BackendChambre[];
  hasCatalogue: boolean;
  services: BackendService[];
  photoUrls?: string[] | null;
  /** Propriétaire (hôte) — pour afficher ses badges publics. */
  proprietaireId?: number | null;
};

/** Réponse GET /users/{id}/badges ou /users/me/badges (UserBadgeItem côté serveur). */
export type BackendUserBadge = {
  badgeId: number;
  libelle: string;
  typeLibelle: string;
  typeDescription: string | null;
};

export type BackendService = {
  id: number;
  libelle: string;
  categorie?: string;
  prix: number;
  unite?: string | null;
  pricingType?: 'INCLUDED' | 'PAID';
  disponibilite?: 'PERMANENT' | 'ON_REQUEST' | 'SEASONAL';
  description?: string | null;
  conditionsUtilisation?: string | null;
  actif: boolean;
  /** /api/files/... si l’hôte a ajouté une image */
  imageUrl?: string | null;
};

/** Liste publique des extras proposés par les établissements validés. */
export type BackendPublicService = {
  id: number;
  libelle: string;
  categorie: string;
  prix: number;
  unite?: string | null;
  pricingType?: 'INCLUDED' | 'PAID';
  disponibilite?: 'PERMANENT' | 'ON_REQUEST' | 'SEASONAL';
  description?: string | null;
  etablissementId: number | null;
  etablissementNom: string;
  ville?: string | null;
  imageUrl?: string | null;
};

export type BackendAvis = {
  id: number;
  note: number;
  commentaire: string;
  reponseHote: string | null;
  dateReponse: string | null;
  auteurId: number;
  createdAt?: string;
  etablissementId?: number;
  reservationId?: number | null;
};

/** Référentiel public (GET sans JWT). */
export type BackendTypeEtablissement = {
  id: number;
  libelle: string;
  description?: string;
};

import { API_BASE_URL } from './apiBase';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  // Minimal API client for PUBLIC endpoints (no JWT injection here).
  // Authenticated calls are handled by AuthContext.authedFetch, which injects Bearer tokens and refreshes on 401.
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await parseJson<{ message?: string }>(res);
      if (err?.message) message = err.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return parseJson<T>(res);
}

export async function getEtablissements(params: {
  page?: number;
  size?: number;
  ville?: string;
  keyword?: string;
  /** ISO yyyy-MM-dd ; filtre disponibilité avec {@link dateFin} */
  dateDebut?: string;
  /** ISO yyyy-MM-dd */
  dateFin?: string;
  /** Appliqué seulement si les deux dates sont valides côté API */
  nombreVoyageurs?: number;
  type?: string;
  sort?: string;
}): Promise<PageResponse<BackendEtablissement>> {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 9));
  if (params.ville) q.set('ville', params.ville);
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.dateDebut) q.set('dateDebut', params.dateDebut);
  if (params.dateFin) q.set('dateFin', params.dateFin);
  if (params.nombreVoyageurs != null && params.nombreVoyageurs >= 1) {
    q.set('nombreVoyageurs', String(params.nombreVoyageurs));
  }
  if (params.type) q.set('type', params.type);
  if (params.sort) q.set('sort', params.sort);
  return backendFetch<PageResponse<BackendEtablissement>>(`/etablissements?${q.toString()}`);
}

export async function getEtablissementDetail(id: number): Promise<BackendEtablissementDetail> {
  return backendFetch<BackendEtablissementDetail>(`/etablissements/${id}`);
}

/** Destinations publiques : villes distinctes des établissements visibles. */
export async function getEtablissementVilles(): Promise<string[]> {
  const list = await backendFetch<string[]>(`/etablissements/villes`);
  return Array.isArray(list) ? list.filter((x) => typeof x === 'string' && x.trim().length > 0) : [];
}

export async function getPublicServices(): Promise<BackendPublicService[]> {
  const list = await backendFetch<BackendPublicService[]>(`/public/services`);
  return Array.isArray(list) ? list : [];
}

export async function getPublicServiceById(id: number): Promise<BackendPublicService> {
  return backendFetch<BackendPublicService>(`/public/services/${id}`);
}

/** Services globaux ajoutés par l'admin (non liés à un établissement). */
export async function getGlobalServices(): Promise<BackendPublicService[]> {
  const list = await backendFetch<BackendPublicService[]>(`/public/global-services`);
  return Array.isArray(list) ? list : [];
}

export async function getAvisByEtablissement(id: number): Promise<BackendAvis[]> {
  return backendFetch<BackendAvis[]>(`/avis/etablissement/${id}`);
}

/** Badges publics d’un utilisateur (recalcul côté serveur des règles automatiques). */
export async function getBadgesByUserId(userId: number): Promise<BackendUserBadge[]> {
  const list = await backendFetch<BackendUserBadge[]>(`/users/${userId}/badges`);
  return Array.isArray(list) ? list : [];
}

export async function getTypesEtablissementActifs(): Promise<BackendTypeEtablissement[]> {
  const list = await backendFetch<BackendTypeEtablissement[]>(`/v1/type-etablissement`);
  return Array.isArray(list) ? list : [];
}

export type BackendCatalogTypeChambre = {
  id: number;
  libelle: string;
  description?: string;
};

/** Liste publique des types de base (style Booking). Essaie deux URLs (alias API). */
export async function getTypesChambreActifs(): Promise<BackendCatalogTypeChambre[]> {
  const paths = ['/type-chambres', '/v1/type-chambre'] as const;
  let lastError: Error | null = null;
  for (const p of paths) {
    try {
      const list = await backendFetch<BackendCatalogTypeChambre[]>(p);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  if (lastError) {
    throw lastError;
  }
  return [];
}

