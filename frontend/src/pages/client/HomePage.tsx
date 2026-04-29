import { ChevronRight, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ClientHeroSection } from '../../components/ClientHeroSection';
import { HomeBubbles } from '../../components/HomeBubbles';
import { HomeSearchBar } from '../../components/HomeSearchBar';
import { HelpFab } from '../../components/HelpFab';
import { Container } from '../../components/ui/Container';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useAuth } from '../../context/AuthContext';
import { formatFCFA } from '../../lib/format';
import {
  getAvisByEtablissement,
  getEtablissementDetail,
  getEtablissements,
  type BackendChambre,
  type BackendEtablissement,
} from '../../lib/backendApi';

export type UiHotelCard = {
  id: number;
  name: string;
  description: string;
  ville: string;
  /** Libellé type d'établissement (ex. hôtel, maison d'hôtes) */
  typeLabel: string;
  cover: string | null;
  qualityBadge: boolean;
  rating: number;
  reviewCount: number;
  fromPrice: number | null;
  favorisCount: number;
};

function firstNonBlankPhotoUrl(urls: string[] | null | undefined): string | null {
  const u = (urls ?? []).find((x) => Boolean(x && String(x).trim()));
  return u ?? null;
}

/** Photos établissement puis, à défaut, première photo d’une chambre. */
function pickListingCover(
  etabUrls: string[] | null | undefined,
  detailUrls: string[] | null | undefined,
  chambres: BackendChambre[] | undefined,
): string | null {
  const fromEtab = firstNonBlankPhotoUrl(detailUrls) ?? firstNonBlankPhotoUrl(etabUrls);
  if (fromEtab) return fromEtab;
  if (chambres?.length) {
    for (const c of chambres) {
      const room = firstNonBlankPhotoUrl(c.photoUrls ?? undefined);
      if (room) return room;
    }
  }
  return null;
}

async function toUiFromBackend(e: BackendEtablissement): Promise<UiHotelCard> {
  const [detail, avis] = await Promise.all([
    getEtablissementDetail(e.id).catch(() => null),
    getAvisByEtablissement(e.id).catch(() => []),
  ]);

  const reviewCount = avis.length;
  const rating =
    reviewCount > 0
      ? Math.round((avis.reduce((s, a) => s + a.note, 0) / reviewCount) * 10) / 10
      : 0;

  const chambres = detail?.chambres ?? [];
  const fromPrice =
    chambres.length > 0
      ? chambres.reduce(
          (min, c) => Math.min(min, Number(c.prixNuit || 0)),
          Number(chambres[0]?.prixNuit || 0),
        )
      : null;

  const typeLabel =
    e.typeEtablissementLibelle?.trim() ||
    e.typeEtablissement?.trim() ||
    'Hébergement';

  return {
    id: e.id,
    name: e.nom,
    description: e.description || 'Sans description.',
    ville: e.ville || 'Ville non renseignée',
    typeLabel,
    cover: pickListingCover(e.photoUrls, detail?.photoUrls, detail?.chambres),
    qualityBadge: Boolean(detail?.hasCatalogue),
    rating,
    reviewCount,
    fromPrice,
    favorisCount: Number(e.favorisCount ?? 0),
  };
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nightsBetweenIso(arrivee: string, depart: string) {
  if (!arrivee || !depart || depart <= arrivee) return null;
  const a = new Date(`${arrivee}T12:00:00`);
  const b = new Date(`${depart}T12:00:00`);
  const n = Math.round((b.getTime() - a.getTime()) / 86400000);
  return n >= 1 ? n : null;
}

function staySubtitleLine(arrivee: string, depart: string) {
  if (!arrivee || !depart || depart <= arrivee) {
    return 'Dates flexibles · Hôte';
  }
  const a = new Date(`${arrivee}T12:00:00`);
  const b = new Date(`${depart}T12:00:00`);
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(a)} – ${fmt(b)} · Hôte`;
}

export function HomePage() {
  const nav = useNavigate();
  const { user, authedFetch } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [cards, setCards] = useState<UiHotelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());

  const searchNights = nightsBetweenIso(dateArrivee, dateDepart);

  async function toggleSave(id: number) {
    if (!user) {
      nav('/connexion');
      return;
    }
    if (savingIds.has(id)) return;
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      const { data } = await authedFetch<{ etablissementId: number; favori: boolean; favorisCount: number }>(
        `/etablissements/${id}/favoris/toggle`,
        { method: 'POST' },
      );
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (data.favori) next.add(id);
        else next.delete(id);
        return next;
      });
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, favorisCount: Number(data.favorisCount ?? c.favorisCount) } : c)),
      );
    } catch (e) {
      // Si la session a expiré, on renvoie à la connexion.
      if (e instanceof Error && e.message === 'Unauthorized') {
        nav('/connexion');
      }
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  useEffect(() => {
    let alive = true;
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    authedFetch<number[]>('/users/me/favoris')
      .then(({ data }) => {
        if (!alive) return;
        setSavedIds(new Set((Array.isArray(data) ? data : []).map((x) => Number(x))));
      })
      .catch(() => {
        if (!alive) return;
        setSavedIds(new Set());
      });
    return () => {
      alive = false;
    };
  }, [user, authedFetch]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getEtablissements({ page: 0, size: 24, sort: 'createdAt,desc' })
      .then(async (page) => {
        if (!alive) return;
        const mapped = await Promise.all(page.content.map((e) => toUiFromBackend(e)));
        if (!alive) return;
        setCards(mapped);
      })
      .catch(() => {
        if (!alive) return;
        setCards([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onSearch() {
    setLoading(true);
    try {
      const hasFullStay = Boolean(dateArrivee && dateDepart && dateDepart > dateArrivee);
      const page = await getEtablissements({
        page: 0,
        size: 24,
        keyword: keyword.trim() || undefined,
        dateDebut: hasFullStay ? dateArrivee : undefined,
        dateFin: hasFullStay ? dateDepart : undefined,
        nombreVoyageurs: hasFullStay ? adults + kids + infants : undefined,
        sort: 'createdAt,desc',
      });
      const mapped = await Promise.all(page.content.map((e) => toUiFromBackend(e)));
      setCards(mapped);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <ClientHeroSection decorations={<HomeBubbles variant="hero" />}>
        <Container className="grid min-h-[min(100vh,760px)] grid-rows-[1fr_auto_auto_1fr] items-center pb-12 pt-24 text-center md:pb-16 md:pt-28">
          <div className="row-start-2">
            <p className="text-center text-[13px] font-semibold uppercase tracking-[0.22em] text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] md:text-sm">
              Réservez votre séjour en quelques clics
            </p>
            <h1 className="mt-3 text-center text-4xl font-bold leading-tight tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] md:text-5xl md:leading-tight">
              Trouvez l&apos;hébergement idéal pour votre prochain voyage
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)] md:text-lg">
              Hôtels, résidences et hébergements vérifiés. Comparez, réservez et gérez vos séjours au même endroit.
            </p>
          </div>
          <div className="row-start-3 mt-16 w-full max-w-4xl justify-self-center md:mt-20">
            <HomeSearchBar
              surface="white"
              keyword={keyword}
              onKeywordChange={setKeyword}
              dateArrivee={dateArrivee}
              dateDepart={dateDepart}
              onDatesChange={(a, d) => {
                setDateArrivee(a);
                setDateDepart(d);
              }}
              adults={adults}
              kids={kids}
              infants={infants}
              pets={pets}
              onGuestsChange={({ adults: a, kids: k, infants: i, pets: p }) => {
                setAdults(a);
                setKids(k);
                setInfants(i);
                setPets(p);
              }}
              minDateIso={todayIsoDate()}
              onSearch={onSearch}
            />
          </div>
        </Container>
      </ClientHeroSection>

      <section className="relative overflow-hidden py-12">
        <div className="pointer-events-none absolute inset-0 z-0">
          <HomeBubbles variant="soft" />
        </div>
        <Container className="relative z-10">
          <SectionHeading
            title={
              <span className="inline-flex items-center gap-1">
                Hébergements à découvrir
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
              </span>
            }
            subtitle="Derniers établissements ajoutés — choisissez votre prochain séjour."
          />

          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-muted shadow-sm">
                Chargement…
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-muted shadow-sm">
                Aucun hébergement disponible pour le moment.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((h) => {
                  const coupDeCoeur = h.favorisCount >= 10;
                  const saved = savedIds.has(h.id);
                  const priceLine =
                    h.fromPrice != null
                      ? searchNights != null
                        ? `${formatFCFA(searchNights * h.fromPrice)} au total`
                        : `${formatFCFA(h.fromPrice)} / nuit`
                      : 'Prix indisponible';
                  const ratingText =
                    h.reviewCount > 0 ? `${String(h.rating).replace('.', ',')}` : '—';

                  return (
                    <article
                      key={h.id}
                      className="group overflow-hidden rounded-2xl border border-line bg-card shadow-[0_2px_12px_rgb(0_0_0/0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgb(0_0_0/0.12)]"
                    >
                      <div className="relative">
                        <Link to={`/etablissement/${h.id}`} className="block">
                          <div className="relative overflow-hidden">
                            {h.cover ? (
                              <img
                                src={h.cover}
                                alt=""
                                className="aspect-[4/3] w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface text-xs font-semibold text-muted">
                                Aucune photo
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                            {coupDeCoeur ? (
                              <span className="absolute left-3 top-3 max-w-[11rem] rounded-full bg-card/95 px-3 py-1 text-[11px] font-semibold leading-tight text-ink shadow-sm backdrop-blur-sm">
                                Coup de cœur voyageurs
                              </span>
                            ) : null}
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleSave(h.id)}
                          disabled={savingIds.has(h.id)}
                          className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card/90 text-ink shadow-sm backdrop-blur-sm transition hover:bg-card disabled:opacity-60"
                          aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          aria-pressed={saved}
                        >
                          <Heart
                            className={`h-[18px] w-[18px] ${saved ? 'fill-[#FF385C] text-[#FF385C]' : 'text-ink'}`}
                            strokeWidth={saved ? 0 : 2}
                          />
                        </button>
                      </div>

                      <div className="p-4">
                        <Link to={`/etablissement/${h.id}`} className="block text-left">
                          <p className="line-clamp-1 text-[15px] font-semibold leading-snug text-ink">
                            {h.typeLabel} · {h.ville}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm text-muted">
                            {staySubtitleLine(dateArrivee, dateDepart)}
                          </p>
                          <p className="mt-2 text-[15px] font-semibold text-ink">
                            {priceLine}
                            <span className="font-normal text-muted"> · </span>
                            <span className="text-[15px]">★</span> {ratingText}
                            {h.reviewCount > 0 ? (
                              <span className="text-sm font-normal text-muted"> ({h.reviewCount})</span>
                            ) : null}
                          </p>
                        </Link>
                        <Link
                          to={`/etablissement/${h.id}`}
                          className="mt-4 flex w-full items-center justify-center rounded-xl bg-ink py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90"
                        >
                          Voir et réserver
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="pb-12">
        <Container>
        <div className="rounded-card border border-line bg-card p-6 shadow-card">
          <h2 className="text-xl font-bold text-ink">Processus de réservation</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-control bg-soft p-4 text-sm text-muted">
              <p className="font-semibold text-ink">1. Choisir un hébergement</p>
              <p className="mt-1">Parcourez les derniers hébergements ajoutés et ouvrez la fiche.</p>
            </div>
            <div className="rounded-control bg-soft p-4 text-sm text-muted">
              <p className="font-semibold text-ink">2. Sélectionner une chambre</p>
              <p className="mt-1">Depuis la fiche, cliquez sur Réserver dans la chambre souhaitée.</p>
            </div>
            <div className="rounded-control bg-soft p-4 text-sm text-muted">
              <p className="font-semibold text-ink">3. Ajouter des services</p>
              <p className="mt-1">Choisissez les services additionnels puis passez au paiement.</p>
            </div>
            <div className="rounded-control bg-soft p-4 text-sm text-muted">
              <p className="font-semibold text-ink">4. Confirmer la réservation</p>
              <p className="mt-1">Validez le paiement pour finaliser la réservation.</p>
            </div>
          </div>
        </div>
        </Container>
      </section>

      <HelpFab />
    </div>
  );
}
