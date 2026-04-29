import type { BackendEtablissement } from './backendApi';

export type AdminStats = {
  totalUsers: number;
  totalEtablissements: number;
  totalReservations: number;
  totalAvis: number;
  etablissementsEnAttenteValidation: number;
  /** Actifs + validés admin (éligibles affichage recherche publique, hors filtres dates). */
  etablissementsPublies: number;
};

export type AdminAvisRow = {
  id: number;
  note: number;
  commentaire: string;
  reponseHote: string | null;
  dateReponse: string | null;
  createdAt: string;
  reservationId: number;
  etablissementId: number;
  etablissementNom: string | null;
  auteurId: number;
  auteurEmail: string | null;
  auteurPrenom: string | null;
  auteurNom: string | null;
};

export type AdminEtablissement = BackendEtablissement & {
  valideAdmin?: boolean;
};
