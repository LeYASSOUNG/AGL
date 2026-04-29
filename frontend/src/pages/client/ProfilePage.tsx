import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ban, Calendar, LayoutDashboard, MapPin, MessageSquare, Pencil, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { HelpFab } from '../../components/HelpFab';
import { HostModal } from '../../components/host/HostModal';
import { StarRating } from '../../components/StarRating';
import { Container } from '../../components/ui/Container';
import { useAuth } from '../../context/AuthContext';
import { formatDateFR, formatFCFA } from '../../lib/format';
import {
  getEtablissementDetail,
  type BackendAvis,
  type BackendEtablissementDetail,
  type BackendUserBadge,
} from '../../lib/backendApi';
import { toUserFacingErrorMessage } from '../../lib/userFacingError';

/** Aligné sur app.reservation.client-cancel-motif-min-length (défaut backend : 10). */
const CLIENT_CANCEL_MOTIF_MIN_LEN = 10;

/** Aligné sur le backend : décodage max 3 Mo pour l’avatar. */
const MAX_AVATAR_FILE_BYTES = 3 * 1024 * 1024;

type AvatarDraft = 'unchanged' | 'clear' | string;

function splitFullName(full: string): { prenom: string; nom: string } {
  const t = full.trim().replace(/\s+/g, ' ');
  if (!t) return { prenom: '', nom: '' };
  const i = t.indexOf(' ');
  if (i <= 0) return { prenom: t, nom: t };
  const nom = t.slice(i + 1).trim();
  return { prenom: t.slice(0, i), nom: nom || t.slice(0, i) };
}

function resolveAvatarSrc(avatarUrl?: string | null): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
  return avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

type BackendStatutReservation = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

type BackendReservationResponse = {
  id: number;
  dateDebut: string;
  dateFin: string;
  nombreVoyageurs: number;
  statut: BackendStatutReservation;
  montantTotal: number;
  etablissementId: number;
  createdAt: string;
  commentaire?: string | null;
  annulationParClientPossible?: boolean | null;
  regleAnnulationClient?: string | null;
  motifRefusAnnulationClient?: string | null;
  modificationParClientPossible?: boolean | null;
  regleModificationClient?: string | null;
  motifRefusModificationClient?: string | null;
};

type BackendReservationDetail = {
  chambres: { id: number; nom: string }[];
  /** Ancien format (ids uniques, quantité 1). */
  serviceIds?: number[];
  /** Lignes avec quantité (nouveau format). */
  serviceLines?: Array<{ serviceId: number; quantity?: number; libelle?: string }>;
};

type ReservationUi = {
  id: number;
  etablissementId: number;
  hotel: string;
  room: string;
  statut: BackendStatutReservation;
  dates: string;
  dateDebutIso: string;
  dateFinIso: string;
  guests: number;
  ville: string;
  total: number;
  reservedAt: string;
  extraServices: number;
  chambreIds: number[];
  serviceSelections: Array<{ serviceId: number; quantity: number }>;
  commentaire: string;
  annulationParClientPossible: boolean;
  regleAnnulationClient?: string | null;
  motifRefusAnnulationClient?: string | null;
  modificationParClientPossible: boolean;
  regleModificationClient?: string | null;
  motifRefusModificationClient?: string | null;
};

type ReviewUi = {
  id: number;
  hotel: string;
  note: number;
  text: string;
  date: string;
};

function clampServiceQty(q: unknown) {
  const n = typeof q === 'number' ? q : Number.parseInt(String(q), 10);
  return Math.max(1, Math.min(99, Number.isFinite(n) ? Math.floor(n) : 1));
}

function reservationStatutLabel(s: BackendStatutReservation) {
  switch (s) {
    case 'CONFIRMEE':
      return 'Confirmée';
    case 'ANNULEE':
      return 'Annulée';
    case 'EN_COURS':
      return 'En cours';
    case 'TERMINEE':
      return 'Terminée';
    default:
      return 'En attente';
  }
}

function clientReservationActionsVisible(statut: BackendStatutReservation) {
  return statut !== 'ANNULEE' && statut !== 'TERMINEE';
}

function reservationStatutBadgeClass(s: BackendStatutReservation) {
  switch (s) {
    case 'CONFIRMEE':
      return 'bg-emerald-100 text-emerald-700';
    case 'ANNULEE':
      return 'bg-red-100 text-red-700';
    case 'EN_COURS':
      return 'bg-sky-100 text-sky-800';
    case 'TERMINEE':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

function ymdFromIso(iso: string): string {
  return (iso || '').slice(0, 10);
}

function serviceSelectionsFromDetail(detail: BackendReservationDetail): Array<{ serviceId: number; quantity: number }> {
  const lines = detail.serviceLines;
  if (Array.isArray(lines) && lines.length > 0) {
    return lines.map((l) => ({
      serviceId: Number(l.serviceId),
      quantity: clampServiceQty(l.quantity ?? 1),
    }));
  }
  const ids = detail.serviceIds;
  if (Array.isArray(ids) && ids.length > 0) {
    return ids.map((id) => ({ serviceId: Number(id), quantity: 1 }));
  }
  return [];
}

/** Date de fin du séjour passée ou aujourd’hui (comparaison ISO yyyy-MM-dd). */
function sejourDateFinAtteinte(dateFinIso: string): boolean {
  const fin = ymdFromIso(dateFinIso);
  if (!fin) return false;
  const today = new Date().toISOString().slice(0, 10);
  return fin <= today;
}

function effectiveReservationStatut(
  statut: BackendStatutReservation,
  dateFinIso: string
): BackendStatutReservation {
  if (statut === 'ANNULEE') return 'ANNULEE';
  if (statut === 'TERMINEE') return 'TERMINEE';
  if (sejourDateFinAtteinte(dateFinIso)) return 'TERMINEE';
  return statut;
}

/** Le client peut poster un avis (pas déjà d’avis pour cette réservation). */
function peutLaisserAvis(r: ReservationUi, reservationIdsAvecAvis: Set<number>): boolean {
  if (reservationIdsAvecAvis.has(r.id)) return false;
  if (r.statut === 'ANNULEE' || r.statut === 'EN_ATTENTE') return false;
  if (r.statut === 'TERMINEE') return true;
  if (r.statut === 'CONFIRMEE' || r.statut === 'EN_COURS') {
    return sejourDateFinAtteinte(r.dateFinIso);
  }
  return false;
}

export function ProfilePage() {
  const { user, authedFetch, syncSessionFromServer, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabRaw = params.get('tab');
  const tab: 'reservations' | 'avis' | 'parametres' =
    tabRaw === 'avis' ? 'avis' : tabRaw === 'parametres' ? 'parametres' : 'reservations';

  const goToTab = useCallback(
    (next: 'reservations' | 'avis' | 'parametres') => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('tab', next);
          return p;
        },
        { replace: true }
      );
      // Feedback immédiat : scroll en haut du contenu.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setParams]
  );

  const compteType =
    user?.roles.includes('ROLE_HOST') ? 'Compte Hôte' : user?.roles.includes('ROLE_ADMIN') ? 'Compte Admin' : 'Compte Client';

  const [fullName, setFullName] = useState<string>(() => (user ? `${user.prenom} ${user.nom}`.trim() : ''));
  const [phone, setPhone] = useState<string>(() => (user?.telephone ?? '').trim());
  const [avatarDraft, setAvatarDraft] = useState<AvatarDraft>('unchanged');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const [reservations, setReservations] = useState<ReservationUi[]>([]);
  const [reservationFilter, setReservationFilter] = useState<'ALL' | BackendStatutReservation>(
    'ALL'
  );
  const [reviews, setReviews] = useState<ReviewUi[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);

  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelMotif, setCancelMotif] = useState('');
  const [cancelAcceptCgu, setCancelAcceptCgu] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [editEtab, setEditEtab] = useState<BackendEtablissementDetail | null>(null);
  const [editLoadingEtab, setEditLoadingEtab] = useState(false);
  const [editDateDebut, setEditDateDebut] = useState('');
  const [editDateFin, setEditDateFin] = useState('');
  const [editGuests, setEditGuests] = useState(1);
  const [editChambreIds, setEditChambreIds] = useState<number[]>([]);
  const [editServiceSelections, setEditServiceSelections] = useState<
    Array<{ serviceId: number; quantity: number }>
  >([]);
  const [editCommentaire, setEditCommentaire] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [reservationIdsAvecAvis, setReservationIdsAvecAvis] = useState<Set<number>>(() => new Set());
  const [accountBadges, setAccountBadges] = useState<BackendUserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(`${user.prenom} ${user.nom}`.trim());
    setPhone((user.telephone ?? '').trim());
  }, [user?.prenom, user?.nom, user?.telephone]);

  useEffect(() => {
    if (!user) {
      setAccountBadges([]);
      return;
    }
    let alive = true;
    setBadgesLoading(true);
    authedFetch<BackendUserBadge[]>('/users/me/badges')
      .then(({ data }) => {
        if (!alive) return;
        setAccountBadges(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setAccountBadges([]);
      })
      .finally(() => {
        if (alive) setBadgesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user, authedFetch]);

  useEffect(() => {
    if (!user) return;

    let alive = true;
    setTabLoading(true);
    setTabError(null);

    (async () => {
      try {
        if (tab === 'reservations') {
          const [mesAvis, list] = await Promise.all([
            authedFetch<BackendAvis[]>('/avis/mes').then((r) => r.data),
            authedFetch<BackendReservationResponse[]>('/reservations/mes').then((r) => r.data),
          ]);
          const idsAvis = new Set(
            mesAvis
              .map((a) => a.reservationId)
              .filter((id): id is number => id != null && Number.isFinite(Number(id)))
              .map((id) => Number(id)),
          );
          if (!alive) return;
          setReservationIdsAvecAvis(idsAvis);

          const enriched = await Promise.all(
            list.map(async (res) => {
              const [detail, etabDetail] = await Promise.all([
                authedFetch<BackendReservationDetail>(`/reservations/${res.id}`).then((r) => r.data),
                getEtablissementDetail(res.etablissementId),
              ]);

              const chambresArr = Array.isArray(detail.chambres) ? detail.chambres : [];
              const chambreIds = chambresArr.map((c) => c.id).filter((id) => Number.isFinite(id));
              const linesFromApi = serviceSelectionsFromDetail(detail);
              const roomName =
                chambresArr.map((c) => c.nom).filter(Boolean).join(', ') || '—';
              const serviceCount = linesFromApi.reduce((acc, l) => acc + l.quantity, 0);
              const statutEff = effectiveReservationStatut(res.statut, res.dateFin);

              return {
                id: res.id,
                etablissementId: res.etablissementId,
                hotel: etabDetail.nom ?? '—',
                room: roomName,
                statut: statutEff,
                dates: `${formatDateFR(res.dateDebut)} - ${formatDateFR(res.dateFin)}`,
                dateDebutIso: res.dateDebut,
                dateFinIso: res.dateFin,
                guests: res.nombreVoyageurs ?? 1,
                ville: etabDetail.ville ?? '—',
                total: Number(res.montantTotal ?? 0),
                reservedAt: formatDateFR(res.createdAt),
                extraServices: serviceCount,
                chambreIds,
                serviceSelections: linesFromApi,
                commentaire: res.commentaire ?? '',
                annulationParClientPossible:
                  statutEff === 'TERMINEE' ? false : Boolean(res.annulationParClientPossible),
                regleAnnulationClient: res.regleAnnulationClient ?? undefined,
                motifRefusAnnulationClient: res.motifRefusAnnulationClient ?? undefined,
                modificationParClientPossible:
                  statutEff === 'TERMINEE' ? false : Boolean(res.modificationParClientPossible),
                regleModificationClient: res.regleModificationClient ?? undefined,
                motifRefusModificationClient: res.motifRefusModificationClient ?? undefined,
              } satisfies ReservationUi;
            })
          );

          if (!alive) return;
          setReservations(enriched);
        } else if (tab === 'avis') {
          const list = await authedFetch<BackendAvis[]>('/avis/mes').then((r) => r.data);

          const enriched = await Promise.all(
            list.map(async (a) => {
              const etabDetail = a.etablissementId ? await getEtablissementDetail(a.etablissementId) : null;
              return {
                id: a.id,
                hotel: etabDetail?.nom ?? `Établissement #${a.etablissementId ?? '—'}`,
                note: a.note,
                text: a.commentaire,
                date: formatDateFR(a.createdAt ?? (a.dateReponse ?? '')),
              } satisfies ReviewUi;
            })
          );

          if (!alive) return;
          setReviews(enriched);
        }
      } catch (e2) {
        if (!alive) return;
        setTabError(toUserFacingErrorMessage(e2));
      } finally {
        if (!alive) return;
        setTabLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tab, user, authedFetch]);

  const reservationDashboardStats = useMemo(() => {
    const counts = {
      actives: 0,
      EN_ATTENTE: 0,
      CONFIRMEE: 0,
      EN_COURS: 0,
      TERMINEE: 0,
      ANNULEE: 0,
    };
    for (const r of reservations) {
      const e = effectiveReservationStatut(r.statut, r.dateFinIso);
      if (e === 'EN_ATTENTE') counts.EN_ATTENTE += 1;
      else if (e === 'CONFIRMEE') counts.CONFIRMEE += 1;
      else if (e === 'EN_COURS') counts.EN_COURS += 1;
      else if (e === 'TERMINEE') counts.TERMINEE += 1;
      else if (e === 'ANNULEE') counts.ANNULEE += 1;
      if (e !== 'TERMINEE') counts.actives += 1;
    }
    return counts;
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const statutEff = effectiveReservationStatut(r.statut, r.dateFinIso);
      if (reservationFilter === 'ALL') return statutEff !== 'TERMINEE';
      return statutEff === reservationFilter;
    });
  }, [reservations, reservationFilter]);

  const cancelTarget = cancelTargetId != null ? reservations.find((x) => x.id === cancelTargetId) : undefined;
  const reviewTarget = reviewTargetId != null ? reservations.find((x) => x.id === reviewTargetId) : undefined;
  const cancelMotifOk = cancelMotif.trim().length >= CLIENT_CANCEL_MOTIF_MIN_LEN;
  const canSubmitCancel = cancelMotifOk && cancelAcceptCgu && !cancelSubmitting;

  async function submitClientCancel() {
    if (cancelTargetId == null || !canSubmitCancel) return;
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      const { data } = await authedFetch<BackendReservationResponse>(`/reservations/${cancelTargetId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motif: cancelMotif.trim() }),
      });
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancelTargetId
            ? {
                ...r,
                statut: data.statut,
                annulationParClientPossible: Boolean(data.annulationParClientPossible),
                regleAnnulationClient: data.regleAnnulationClient ?? r.regleAnnulationClient,
                motifRefusAnnulationClient: data.motifRefusAnnulationClient ?? r.motifRefusAnnulationClient,
                modificationParClientPossible: Boolean(data.modificationParClientPossible),
                regleModificationClient: data.regleModificationClient ?? r.regleModificationClient,
                motifRefusModificationClient: data.motifRefusModificationClient ?? r.motifRefusModificationClient,
              }
            : r
        )
      );
      setCancelTargetId(null);
      setCancelMotif('');
      setCancelAcceptCgu(false);
    } catch (e2) {
      setCancelError(e2 instanceof Error ? e2.message : 'Annulation impossible');
    } finally {
      setCancelSubmitting(false);
    }
  }

  async function submitReview() {
    if (reviewTargetId == null) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await authedFetch<BackendAvis>('/avis', {
        method: 'POST',
        body: JSON.stringify({
          reservationId: reviewTargetId,
          note: reviewNote,
          commentaire: reviewComment.trim(),
        }),
      });
      setReservationIdsAvecAvis((prev) => new Set([...prev, reviewTargetId]));
      setReviewTargetId(null);
      setReviewComment('');
      setReviewNote(5);
    } catch (e2) {
      setReviewError(e2 instanceof Error ? e2.message : 'Envoi impossible');
    } finally {
      setReviewSubmitting(false);
    }
  }

  const editTarget = editTargetId != null ? reservations.find((x) => x.id === editTargetId) : undefined;
  const editFormValid =
    editDateDebut &&
    editDateFin &&
    editChambreIds.length > 0 &&
    editGuests >= 1 &&
    !editSubmitting &&
    !editLoadingEtab;

  async function openEditModal(r: ReservationUi) {
    setCancelTargetId(null);
    setEditTargetId(r.id);
    setEditDateDebut(r.dateDebutIso);
    setEditDateFin(r.dateFinIso);
    setEditGuests(r.guests);
    setEditChambreIds(r.chambreIds.length > 0 ? [...r.chambreIds] : []);
    setEditServiceSelections([...r.serviceSelections]);
    setEditCommentaire(r.commentaire ?? '');
    setEditError(null);
    setEditEtab(null);
    setEditLoadingEtab(true);
    try {
      const etab = await getEtablissementDetail(r.etablissementId);
      setEditEtab(etab);
      if (r.chambreIds.length === 0 && etab.chambres?.length === 1) {
        setEditChambreIds([etab.chambres[0].id]);
      }
    } catch {
      setEditError("Impossible de charger l'établissement.");
    } finally {
      setEditLoadingEtab(false);
    }
  }

  function toggleEditChambre(id: number) {
    setEditChambreIds((prev) => {
      if (prev.includes(id)) {
        return prev.length <= 1 ? prev : prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function toggleEditPaidService(serviceId: number) {
    setEditServiceSelections((prev) => {
      const i = prev.findIndex((x) => x.serviceId === serviceId);
      if (i >= 0) return prev.filter((_, j) => j !== i);
      return [...prev, { serviceId, quantity: 1 }];
    });
  }

  function setEditPaidServiceQty(serviceId: number, rawQty: number) {
    const q = clampServiceQty(rawQty);
    setEditServiceSelections((prev) =>
      prev.map((x) => (x.serviceId === serviceId ? { ...x, quantity: q } : x))
    );
  }

  async function submitClientUpdate() {
    if (editTargetId == null || !editFormValid) return;
    const row = reservations.find((x) => x.id === editTargetId);
    if (!row) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const { data } = await authedFetch<BackendReservationResponse>(`/reservations/${editTargetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          etablissementId: row.etablissementId,
          chambreIds: editChambreIds,
          serviceSelections: editServiceSelections.map(({ serviceId, quantity }) => ({
            serviceId,
            quantity: clampServiceQty(quantity),
          })),
          dateDebut: editDateDebut,
          dateFin: editDateFin,
          nombrePersonnes: editGuests,
          commentaire: editCommentaire.trim() || null,
        }),
      });
      const names =
        editEtab?.chambres
          .filter((c) => editChambreIds.includes(c.id))
          .map((c) => c.nomPersonnalise || c.nom)
          .filter(Boolean) ?? [];
      const roomLabel = names.length > 0 ? names.join(', ') : row.room;
      setReservations((prev) =>
        prev.map((r) =>
          r.id === editTargetId
            ? {
                ...r,
                dateDebutIso: data.dateDebut,
                dateFinIso: data.dateFin,
                dates: `${formatDateFR(data.dateDebut)} - ${formatDateFR(data.dateFin)}`,
                guests: data.nombreVoyageurs,
                total: Number(data.montantTotal ?? 0),
                extraServices: editServiceSelections.reduce((acc, x) => acc + x.quantity, 0),
                chambreIds: [...editChambreIds],
                serviceSelections: [...editServiceSelections],
                commentaire: data.commentaire ?? '',
                room: roomLabel,
                annulationParClientPossible: Boolean(data.annulationParClientPossible),
                regleAnnulationClient: data.regleAnnulationClient ?? r.regleAnnulationClient,
                motifRefusAnnulationClient: data.motifRefusAnnulationClient ?? r.motifRefusAnnulationClient,
                modificationParClientPossible: Boolean(data.modificationParClientPossible),
                regleModificationClient: data.regleModificationClient ?? r.regleModificationClient,
                motifRefusModificationClient: data.motifRefusModificationClient ?? r.motifRefusModificationClient,
              }
            : r
        )
      );
      setEditTargetId(null);
      setEditEtab(null);
    } catch (e2) {
      setEditError(e2 instanceof Error ? e2.message : 'Modification impossible');
    } finally {
      setEditSubmitting(false);
    }
  }

  const asideAvatarSrc =
    avatarDraft === 'clear'
      ? undefined
      : typeof avatarDraft === 'string'
        ? avatarDraft
        : resolveAvatarSrc(user?.avatarUrl);

  async function saveProfilePersonal() {
    if (!user) return;
    setProfileSaveBusy(true);
    setProfileSaveError(null);
    try {
      const nextFull = fullName.trim().replace(/\s+/g, ' ');
      const currentFull = `${user.prenom} ${user.nom}`.trim().replace(/\s+/g, ' ');
      const nextPhone = phone.trim();
      const currentPhone = (user.telephone ?? '').trim();

      const body: Record<string, unknown> = {};

      if (nextFull && nextFull !== currentFull) {
        const { prenom: p, nom: n } = splitFullName(nextFull);
        if (p.trim()) body.prenom = p.trim().slice(0, 100);
        if (n.trim()) body.nom = n.trim().slice(0, 100);
      }

      if (nextPhone && nextPhone !== currentPhone) {
        body.telephone = nextPhone.slice(0, 30);
      }
      if (avatarDraft === 'clear') body.avatarDataUrl = '';
      else if (typeof avatarDraft === 'string') body.avatarDataUrl = avatarDraft;
      if (Object.keys(body).length === 0) {
        return;
      }
      await authedFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setAvatarDraft('unchanged');
      await syncSessionFromServer();
    } catch (e2) {
      setProfileSaveError(e2 instanceof Error ? e2.message : 'Enregistrement impossible');
    } finally {
      setProfileSaveBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <Container className="py-8">
        <BackNavLogo to="/" label="Retour accueil" />
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-card border border-line bg-white p-6 text-center shadow-card">
              <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand/15 text-2xl font-bold text-brand">
                {asideAvatarSrc ? (
                  <img src={asideAvatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{(user?.prenom?.[0] ?? 'U').toUpperCase()}</span>
                )}
              </div>
              <p className="mt-4 font-bold text-ink">
                {user ? `${user.prenom} ${user.nom}`.trim() : 'Invité'}
              </p>
              <p className="mt-1 text-sm text-muted">{user?.email ?? '—'}</p>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-brand"
                onClick={() => goToTab('parametres')}
              >
                Modifier le profil
              </button>
            </div>
            <div className="rounded-card border border-line bg-white p-6 shadow-card">
              <h3 className="font-bold text-ink">Statistiques</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted">Réservations</span>
                  <span className="font-semibold">{reservations.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted">Avis laissés</span>
                  <span className="font-semibold">{reviews.length}</span>
                </li>
              </ul>
            </div>
            <div className="rounded-card border border-line bg-white p-6 shadow-card">
              <h3 className="font-bold text-ink">Mes badges</h3>
              {badgesLoading ? (
                <p className="mt-3 text-sm text-muted">Chargement…</p>
              ) : accountBadges.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Aucun badge pour l&apos;instant. Ils s&apos;ajoutent selon votre activité (séjours, avis reçus en
                  tant qu&apos;hôte, etc.).
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {accountBadges.map((b) => (
                    <li key={b.badgeId}>
                      <span className="font-semibold text-ink">{b.typeLibelle || b.libelle}</span>
                      {b.typeDescription ? (
                        <p className="mt-0.5 text-xs text-muted">{b.typeDescription}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <main>
            <h1 className="text-2xl font-bold text-ink">Mon profil</h1>
            <div className="mt-6 inline-flex rounded-control border border-black/[0.06] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => goToTab('reservations')}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium ${
                  tab === 'reservations' ? 'bg-surface text-ink shadow-sm' : 'text-muted'
                }`}
              >
                Mes réservations
              </button>
              <button
                type="button"
                onClick={() => goToTab('avis')}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium ${
                  tab === 'avis' ? 'bg-surface text-ink shadow-sm' : 'text-muted'
                }`}
              >
                Mes avis
              </button>
              <button
                type="button"
                onClick={() => goToTab('parametres')}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium ${
                  tab === 'parametres' ? 'bg-surface text-ink shadow-sm' : 'text-muted'
                }`}
              >
                Paramètres du compte
              </button>
            </div>

            {tab === 'reservations' && (
              <div className="mt-6 space-y-6">
                <section className="rounded-card border border-line bg-white p-6 shadow-card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand/10 text-brand">
                        <LayoutDashboard className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-ink sm:text-xl">Mes réservations</h2>
                        <p className="mt-1 text-sm text-muted">
                          Vue d’ensemble de vos séjours — filtrez par statut ou ouvrez une carte pour agir.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 rounded-control border border-line bg-surface px-4 py-3 text-sm text-muted">
                    Après la <strong className="text-ink">date de fin</strong> du séjour (ou si la réservation est{' '}
                    <strong className="text-ink">terminée</strong>), le bouton{' '}
                    <strong className="text-ink">Laisser un avis</strong> apparaît sur la carte — note de 1 à 5 et
                    commentaire optionnel.
                  </p>

                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Filtres</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                      {(
                        [
                          ['ALL', 'Toutes', reservationDashboardStats.actives, 'Hors terminées'] as const,
                          ['EN_ATTENTE', 'En attente', reservationDashboardStats.EN_ATTENTE, null] as const,
                          ['CONFIRMEE', 'Confirmées', reservationDashboardStats.CONFIRMEE, null] as const,
                          ['EN_COURS', 'En cours', reservationDashboardStats.EN_COURS, null] as const,
                          ['TERMINEE', 'Terminées', reservationDashboardStats.TERMINEE, null] as const,
                          ['ANNULEE', 'Annulées', reservationDashboardStats.ANNULEE, null] as const,
                        ] as const
                      ).map(([id, label, count, hint]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setReservationFilter(id)}
                          className={`flex flex-col rounded-control border px-3 py-3 text-left transition ${
                            reservationFilter === id
                              ? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand/30'
                              : 'border-line bg-surface hover:border-black/10 hover:bg-white'
                          }`}
                        >
                          <span className="text-xs font-medium text-muted">{label}</span>
                          <span className="mt-1 text-2xl font-bold tabular-nums text-ink">{count}</span>
                          {hint ? <span className="mt-0.5 text-[11px] leading-tight text-muted">{hint}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {tabLoading ? (
                  <p className="text-sm text-muted">Chargement…</p>
                ) : tabError ? (
                  <p className="text-sm text-red-600">{tabError}</p>
                ) : reservations.length === 0 ? (
                  <div className="rounded-card border border-dashed border-line bg-white/60 px-6 py-12 text-center text-sm text-muted">
                    Aucune réservation pour le moment.
                  </div>
                ) : (
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <h3 className="text-base font-bold text-ink">Détail des séjours</h3>
                      <p className="text-sm text-muted">
                        {filteredReservations.length} / {reservations.length} selon le filtre
                      </p>
                    </div>
                    {filteredReservations.length === 0 ? (
                      <div className="rounded-card border border-dashed border-line bg-white/60 px-6 py-10 text-center text-sm text-muted">
                        Aucune réservation pour ce filtre.
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {filteredReservations.map((r) => {
                          const statutEff = effectiveReservationStatut(r.statut, r.dateFinIso);
                          return (
                            <article
                              key={r.id}
                              className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface/80 px-5 py-4">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-bold text-ink">{r.hotel}</p>
                                  <p className="mt-0.5 text-sm font-medium text-ink">{r.room}</p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${reservationStatutBadgeClass(
                                    statutEff
                                  )}`}
                                >
                                  {reservationStatutLabel(statutEff)}
                                </span>
                              </div>
                              <div className="flex flex-1 flex-col p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="flex flex-wrap gap-4 text-sm text-muted">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                                      {r.dates}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-4 w-4 shrink-0" aria-hidden />
                                      {r.guests} personne(s)
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                                      {r.ville}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted">Montant total</p>
                                    <p className="text-xl font-bold text-brand">{formatFCFA(r.total)}</p>
                                    <p className="text-xs text-muted">Réservé le {r.reservedAt}</p>
                                  </div>
                                </div>
                                {r.extraServices > 0 ? (
                                  <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                                    Services additionnels : {r.extraServices}
                                  </p>
                                ) : null}

                                {(r.regleAnnulationClient || r.motifRefusAnnulationClient) &&
                                statutEff !== 'ANNULEE' ? (
                                  <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                                    {r.regleAnnulationClient ? (
                                      <p className="text-muted">
                                        <span className="font-semibold text-ink">Annulation : </span>
                                        {r.regleAnnulationClient}
                                      </p>
                                    ) : null}
                                    {!r.annulationParClientPossible && r.motifRefusAnnulationClient ? (
                                      <p className="text-amber-800">{r.motifRefusAnnulationClient}</p>
                                    ) : null}
                                  </div>
                                ) : null}

                                {(r.regleModificationClient || r.motifRefusModificationClient) &&
                                statutEff !== 'ANNULEE' ? (
                                  <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                                    {r.regleModificationClient ? (
                                      <p className="text-muted">
                                        <span className="font-semibold text-ink">Modification : </span>
                                        {r.regleModificationClient}
                                      </p>
                                    ) : null}
                                    {!r.modificationParClientPossible && r.motifRefusModificationClient ? (
                                      <p className="text-amber-800">{r.motifRefusModificationClient}</p>
                                    ) : null}
                                  </div>
                                ) : null}

                                {clientReservationActionsVisible(r.statut) ||
                                peutLaisserAvis(r, reservationIdsAvecAvis) ? (
                                  <div className="mt-auto border-t border-line pt-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Actions</p>
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                      {clientReservationActionsVisible(r.statut) ? (
                                        <>
                                          <button
                                            type="button"
                                            disabled={!r.modificationParClientPossible}
                                            title={
                                              r.modificationParClientPossible
                                                ? 'Modifier dates, voyageurs, chambres ou services'
                                                : (r.motifRefusModificationClient ??
                                                  r.regleModificationClient ??
                                                  'Modification non disponible pour cette réservation')
                                            }
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-control border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
                                            onClick={() => {
                                              if (!r.modificationParClientPossible) return;
                                              void openEditModal(r);
                                            }}
                                          >
                                            <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                                            Modifier la réservation
                                          </button>
                                          <button
                                            type="button"
                                            disabled={!r.annulationParClientPossible}
                                            title={
                                              r.annulationParClientPossible
                                                ? 'Annuler avec motif (conditions affichées ci-dessus)'
                                                : (r.motifRefusAnnulationClient ??
                                                  r.regleAnnulationClient ??
                                                  'Annulation non disponible en ligne pour cette réservation')
                                            }
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
                                            onClick={() => {
                                              if (!r.annulationParClientPossible) return;
                                              setEditTargetId(null);
                                              setCancelTargetId(r.id);
                                              setCancelMotif('');
                                              setCancelAcceptCgu(false);
                                              setCancelError(null);
                                            }}
                                          >
                                            <Ban className="h-4 w-4 shrink-0" aria-hidden />
                                            Annuler la réservation
                                          </button>
                                        </>
                                      ) : null}
                                      {peutLaisserAvis(r, reservationIdsAvecAvis) ? (
                                        <button
                                          type="button"
                                          className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 sm:w-auto sm:min-w-[200px]"
                                          onClick={() => {
                                            setReviewTargetId(r.id);
                                            setReviewNote(5);
                                            setReviewComment('');
                                            setReviewError(null);
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                                          Laisser un avis
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {tab === 'avis' && (
              <div className="mt-6 space-y-4">
                {tabLoading ? (
                  <p className="text-sm text-muted">Chargement…</p>
                ) : tabError ? (
                  <p className="text-sm text-red-600">{tabError}</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted">Aucun avis.</p>
                ) : (
                  reviews.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-card border border-line bg-white p-6 shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-ink">{a.hotel}</p>
                        <StarRating value={a.note} />
                      </div>
                      <p className="mt-2 text-sm text-ink">{a.text}</p>
                      <p className="mt-2 text-xs text-muted">{a.date}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'parametres' && (
              <div className="mt-6 space-y-8">
                <section className="rounded-card border border-line bg-white p-6 shadow-card">
                  <h2 className="text-xl font-bold text-ink">Informations personnelles</h2>

                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      if (!f.type.startsWith('image/')) {
                        setProfileSaveError('Veuillez choisir une image (JPEG, PNG ou WebP).');
                        return;
                      }
                      if (f.size > MAX_AVATAR_FILE_BYTES) {
                        setProfileSaveError("L'image doit faire au plus 3 Mo.");
                        return;
                      }
                      void (async () => {
                        try {
                          const dataUrl = await fileToDataUrl(f);
                          setAvatarDraft(dataUrl);
                          setProfileSaveError(null);
                        } catch {
                          setProfileSaveError('Lecture du fichier impossible.');
                        }
                      })();
                    }}
                  />

                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-xl font-bold text-brand">
                      {asideAvatarSrc ? (
                        <img src={asideAvatarSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{(user?.prenom?.[0] ?? '?').toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-surface"
                        onClick={() => avatarFileInputRef.current?.click()}
                      >
                        Choisir une photo
                      </button>
                      {(typeof avatarDraft === 'string' ||
                        (avatarDraft === 'unchanged' && user?.avatarUrl)) && (
                        <button
                          type="button"
                          className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
                          onClick={() => {
                            setAvatarDraft('clear');
                            setProfileSaveError(null);
                          }}
                        >
                          Supprimer la photo
                        </button>
                      )}
                      {avatarDraft !== 'unchanged' ? (
                        <button
                          type="button"
                          className="rounded-control px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
                          onClick={() => {
                            setAvatarDraft('unchanged');
                            setProfileSaveError(null);
                          }}
                        >
                          Annuler le changement de photo
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Formats acceptés : JPEG, PNG, WebP — max. 3 Mo. Enregistrez pour appliquer la photo au compte.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-ink">
                      Nom complet
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-ink">
                      Téléphone
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 XX XX XX XX XX"
                        className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                      />
                    </label>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-ink">Email</label>
                      <input
                        value={user?.email ?? ''}
                        readOnly
                        className="w-full cursor-not-allowed rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand/40"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-ink">Type de compte</label>
                      <input
                        value={compteType}
                        readOnly
                        className="w-full cursor-not-allowed rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand/40"
                      />
                    </div>
                  </div>

                  {profileSaveError ? <p className="mt-4 text-sm text-red-600">{profileSaveError}</p> : null}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={profileSaveBusy}
                      className="rounded-control bg-ink px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      onClick={() => void saveProfilePersonal()}
                    >
                      {profileSaveBusy ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </section>

                <section className="rounded-card border border-line bg-white p-6 shadow-card">
                  <h2 className="text-xl font-bold text-ink">Changer le mot de passe</h2>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-ink">
                      Mot de passe actuel
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-ink">
                      Nouveau mot de passe
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-ink md:col-span-2">
                      Confirmer le nouveau mot de passe
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-2 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="rounded-control bg-ink px-6 py-2.5 text-sm font-semibold text-white"
                      onClick={() => {
                        // Mock : aucun appel API
                      }}
                    >
                      Changer le mot de passe
                    </button>
                  </div>
                </section>

                <section className="rounded-card border border-line bg-white p-6 shadow-card">
                  <h2 className="text-xl font-bold text-ink">Préférences</h2>

                  <div className="mt-6 space-y-4">
                    <label className="flex cursor-pointer items-center justify-between rounded-control bg-surface px-4 py-3">
                      <span className="text-sm font-semibold text-ink">Notifications par email</span>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-4 w-4 accent-ink"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between rounded-control bg-surface px-4 py-3">
                      <span className="text-sm font-semibold text-ink">Notifications push</span>
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="h-4 w-4 accent-ink"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-card border border-red-200 bg-red-50 p-6 shadow-card">
                  <h2 className="text-xl font-bold text-red-700">Zone dangereuse</h2>
                  <p className="mt-3 text-sm text-red-700">
                    La suppression du compte est irréversible. Toute donnée liée à vos réservations sera
                    perdue.
                  </p>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="rounded-control bg-red-600 px-6 py-2.5 text-sm font-semibold text-white"
                      onClick={() => {
                        setDeleteConfirmText('');
                        setDeleteError(null);
                        setDeleteOpen(true);
                      }}
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </Container>
      <HelpFab />

      <HostModal
        open={deleteOpen}
        title="Supprimer mon compte"
        onClose={() => {
          if (deleteBusy) return;
          setDeleteOpen(false);
          setDeleteConfirmText('');
          setDeleteError(null);
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              disabled={deleteBusy}
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmText('');
                setDeleteError(null);
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-control bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={deleteBusy || deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER'}
              onClick={() => {
                void (async () => {
                  setDeleteBusy(true);
                  setDeleteError(null);
                  try {
                    await authedFetch<void>('/users/me', { method: 'DELETE' });
                    await logout();
                    navigate('/', { replace: true });
                  } catch (e2) {
                    setDeleteError(toUserFacingErrorMessage(e2));
                  } finally {
                    setDeleteBusy(false);
                  }
                })();
              }}
            >
              {deleteBusy ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-ink">
          <p className="text-red-800">
            Cette action est <span className="font-semibold">irréversible</span>. Votre compte sera désactivé et vos
            informations personnelles seront supprimées.
          </p>
          <label className="block">
            <span className="font-semibold">Tapez “SUPPRIMER” pour confirmer</span>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-red-400 focus:ring-2"
              disabled={deleteBusy}
            />
          </label>
          {deleteError ? <p className="text-sm text-red-700">{deleteError}</p> : null}
        </div>
      </HostModal>

      <HostModal
        open={cancelTarget != null}
        title="Annuler la réservation"
        onClose={() => {
          if (cancelSubmitting) return;
          setCancelTargetId(null);
          setCancelMotif('');
          setCancelAcceptCgu(false);
          setCancelError(null);
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              disabled={cancelSubmitting}
              onClick={() => {
                setCancelTargetId(null);
                setCancelMotif('');
                setCancelAcceptCgu(false);
                setCancelError(null);
              }}
            >
              Retour
            </button>
            <button
              type="button"
              className="rounded-control bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!canSubmitCancel}
              onClick={() => void submitClientCancel()}
            >
              {cancelSubmitting ? 'Annulation…' : 'Confirmer l’annulation'}
            </button>
          </div>
        }
      >
        {cancelTarget ? (
          <div className="space-y-4 text-sm text-ink">
            <p>
              <span className="font-semibold">{cancelTarget.hotel}</span> — {cancelTarget.dates}
            </p>
            {cancelTarget.regleAnnulationClient ? (
              <p className="rounded-control bg-surface p-3 text-muted">{cancelTarget.regleAnnulationClient}</p>
            ) : null}
            <label className="block font-semibold">
              Motif d’annulation (obligatoire, min. {CLIENT_CANCEL_MOTIF_MIN_LEN} caractères)
              <textarea
                value={cancelMotif}
                onChange={(e) => setCancelMotif(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-brand focus:ring-2"
                placeholder="Expliquez brièvement la raison (ex. changement de programme, empêchement…)"
              />
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={cancelAcceptCgu}
                onChange={(e) => setCancelAcceptCgu(e.target.checked)}
                className="mt-1 h-4 w-4 accent-ink"
              />
              <span className="text-muted">
                Je confirme avoir lu la règle ci-dessus. Les annulations sans motif sérieux ou répétées peuvent faire
                l’objet de mesures prévues par les conditions générales.
              </span>
            </label>
            {cancelError ? <p className="text-sm text-red-600">{cancelError}</p> : null}
          </div>
        ) : null}
      </HostModal>

      <HostModal
        open={editTarget != null}
        title="Modifier la réservation"
        onClose={() => {
          if (editSubmitting) return;
          setEditTargetId(null);
          setEditEtab(null);
          setEditError(null);
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              disabled={editSubmitting}
              onClick={() => {
                setEditTargetId(null);
                setEditEtab(null);
                setEditError(null);
              }}
            >
              Fermer
            </button>
            <button
              type="button"
              className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!editFormValid}
              onClick={() => void submitClientUpdate()}
            >
              {editSubmitting ? 'Enregistrement…' : 'Enregistrer les changements'}
            </button>
          </div>
        }
      >
        {editTarget ? (
          <div className="space-y-4 text-sm text-ink">
            <p>
              <span className="font-semibold">{editTarget.hotel}</span>
            </p>
            {editTarget.regleModificationClient ? (
              <p className="rounded-control bg-surface p-3 text-muted">{editTarget.regleModificationClient}</p>
            ) : null}
            {editLoadingEtab ? <p className="text-muted">Chargement des chambres et services…</p> : null}
            {editEtab ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block font-semibold">
                    Arrivée
                    <input
                      type="date"
                      value={editDateDebut}
                      onChange={(e) => setEditDateDebut(e.target.value)}
                      className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                    />
                  </label>
                  <label className="block font-semibold">
                    Départ
                    <input
                      type="date"
                      value={editDateFin}
                      onChange={(e) => setEditDateFin(e.target.value)}
                      className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                    />
                  </label>
                </div>
                <label className="block font-semibold">
                  Voyageurs
                  <input
                    type="number"
                    min={1}
                    value={editGuests}
                    onChange={(e) => setEditGuests(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                  />
                </label>
                <div>
                  <p className="font-semibold">Chambres</p>
                  <p className="mt-1 text-xs text-muted">Au moins une chambre sélectionnée.</p>
                  <ul className="mt-2 space-y-2">
                    {editEtab.chambres.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editChambreIds.includes(c.id)}
                            onChange={() => toggleEditChambre(c.id)}
                            className="h-4 w-4 accent-ink"
                          />
                          <span>{c.nomPersonnalise || c.nom}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
                {editEtab.services?.length ? (
                  <div>
                    <p className="font-semibold">Services additionnels</p>
                    <ul className="mt-2 space-y-2">
                      {editEtab.services
                        .filter((s) => s.actif !== false && (s.pricingType ?? 'PAID') === 'PAID')
                        .map((s) => {
                          const sel = editServiceSelections.find((x) => x.serviceId === s.id);
                          return (
                            <li key={s.id} className="space-y-2">
                              <label className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(sel)}
                                  onChange={() => toggleEditPaidService(s.id)}
                                  className="h-4 w-4 accent-ink"
                                />
                                <span>
                                  {s.libelle}{' '}
                                  <span className="text-muted">({formatFCFA(s.prix)})</span>
                                </span>
                              </label>
                              {sel ? (
                                <label className="ml-6 block text-xs text-muted">
                                  Quantité
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={sel.quantity}
                                    onChange={(e) =>
                                      setEditPaidServiceQty(s.id, Number.parseInt(e.target.value, 10))
                                    }
                                    className="ml-2 w-16 rounded border border-line bg-white px-2 py-1 text-sm text-ink"
                                  />
                                </label>
                              ) : null}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ) : null}
                <label className="block font-semibold">
                  Commentaire (optionnel)
                  <textarea
                    value={editCommentaire}
                    onChange={(e) => setEditCommentaire(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                  />
                </label>
              </>
            ) : null}
            {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          </div>
        ) : null}
      </HostModal>

      <HostModal
        open={reviewTarget != null}
        title="Laisser un avis"
        onClose={() => {
          if (reviewSubmitting) return;
          setReviewTargetId(null);
          setReviewError(null);
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              disabled={reviewSubmitting}
              onClick={() => {
                setReviewTargetId(null);
                setReviewError(null);
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-control bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={reviewSubmitting || reviewNote < 1 || reviewNote > 5}
              onClick={() => void submitReview()}
            >
              {reviewSubmitting ? 'Publication…' : 'Publier mon avis'}
            </button>
          </div>
        }
      >
        {reviewTarget ? (
          <div className="space-y-4 text-sm text-ink">
            <p>
              <span className="font-semibold">{reviewTarget.hotel}</span> — {reviewTarget.dates}
            </p>
            <label className="block font-semibold">
              Note (obligatoire)
              <select
                value={reviewNote}
                onChange={(e) => setReviewNote(Number(e.target.value))}
                className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-semibold">
              Commentaire (optionnel)
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                maxLength={2000}
                className="mt-2 w-full rounded-control border border-line bg-white px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
                placeholder="Partagez votre expérience (max. 2000 caractères)"
              />
            </label>
            {reviewError ? <p className="text-sm text-red-600">{reviewError}</p> : null}
          </div>
        ) : null}
      </HostModal>
    </div>
  );
}
