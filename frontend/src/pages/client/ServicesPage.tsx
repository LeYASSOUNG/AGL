import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { ClientHeroSection } from '../../components/ClientHeroSection';
import { HelpFab } from '../../components/HelpFab';
import { HomeSearchBar } from '../../components/HomeSearchBar';
import { formatFCFA } from '../../lib/format';
import { getPublicServices, type BackendPublicService } from '../../lib/backendApi';
import { serviceCategoryLabel } from '../../lib/serviceCategories';
import { toUserFacingErrorMessage } from '../../lib/userFacingError';
import { serviceImageUrl } from '../../lib/serviceImage';

function disponibiliteLabel(v: BackendPublicService['disponibilite'] | undefined) {
  if (!v) return '';
  if (v === 'PERMANENT') return 'Permanent';
  if (v === 'ON_REQUEST') return 'Sur demande';
  if (v === 'SEASONAL') return 'Saisonnier';
  return String(v).replaceAll('_', ' ').toLowerCase();
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Filtre « type de service » : correspond à une catégorie réelle renvoyée par l’API. */
function matchesServiceTypeFilter(s: BackendPublicService, typeId: string): boolean {
  if (!typeId) return true;
  const cat = (s.categorie || '').trim().toUpperCase();
  return cat.length > 0 && cat === String(typeId).trim().toUpperCase();
}

function applyFilters(
  list: BackendPublicService[],
  keyword: string,
  serviceType: string,
  pricingFilter: 'ALL' | 'PAID' | 'INCLUDED',
): BackendPublicService[] {
  const kw = keyword.trim().toLowerCase();
  return list.filter((s) => {
    if (pricingFilter !== 'ALL') {
      const pt = (s.pricingType ?? 'PAID').toUpperCase();
      if (pricingFilter === 'PAID' && pt !== 'PAID') return false;
      if (pricingFilter === 'INCLUDED' && pt !== 'INCLUDED') return false;
    }
    if (kw) {
      const hit =
        s.libelle.toLowerCase().includes(kw) ||
        s.etablissementNom.toLowerCase().includes(kw) ||
        (s.ville ?? '').toLowerCase().includes(kw) ||
        (s.description ?? '').toLowerCase().includes(kw);
      if (!hit) return false;
    }
    return matchesServiceTypeFilter(s, serviceType);
  });
}

export function ServicesPage() {
  const [keyword, setKeyword] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);

  const [allServices, setAllServices] = useState<BackendPublicService[]>([]);
  const [displayed, setDisplayed] = useState<BackendPublicService[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [pricingFilter, setPricingFilter] = useState<'ALL' | 'PAID' | 'INCLUDED'>('ALL');
  const [sort, setSort] = useState<'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'ALPHA'>('RELEVANCE');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    getPublicServices()
      .then((list) => {
        if (!alive) return;
        setAllServices(list);
        setDisplayed(list);
        setCatalogError(null);
        setCatalogLoaded(true);
      })
      .catch((e) => {
        if (!alive) return;
        setAllServices([]);
        setDisplayed([]);
        setCatalogError(toUserFacingErrorMessage(e));
        setCatalogLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const onSearch = useCallback(() => {
    setDisplayed(applyFilters(allServices, keyword, serviceType, pricingFilter));
  }, [allServices, keyword, serviceType, pricingFilter]);

  const hasCatalog = catalogLoaded && allServices.length > 0;
  const filteredEmpty = catalogLoaded && allServices.length > 0 && displayed.length === 0;

  const finalList = useMemo(() => {
    const list = [...displayed];
    if (sort === 'ALPHA') {
      list.sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
      return list;
    }
    if (sort === 'PRICE_ASC') {
      list.sort((a, b) => Number(a.prix) - Number(b.prix));
      return list;
    }
    if (sort === 'PRICE_DESC') {
      list.sort((a, b) => Number(b.prix) - Number(a.prix));
      return list;
    }
    return list;
  }, [displayed, sort]);

  const grouped = useMemo(() => {
    const m = new Map<string, BackendPublicService[]>();
    for (const s of finalList) {
      const cat = (s.categorie || 'AUTRE').trim().toUpperCase() || 'AUTRE';
      const arr = m.get(cat);
      if (arr) arr.push(s);
      else m.set(cat, [s]);
    }
    return Array.from(m.entries())
      .map(([categorie, items]) => ({ categorie, items }))
      .sort((a, b) => serviceCategoryLabel(a.categorie).localeCompare(serviceCategoryLabel(b.categorie), 'fr'));
  }, [finalList]);

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <ClientHeroSection>
        <div className="mx-auto grid min-h-[min(100vh,760px)] max-w-6xl grid-rows-[1fr_auto_auto_1fr] items-center px-4 pb-12 pt-24 text-center md:px-8 md:pb-16 md:pt-28">
          <div className="row-start-2">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
              Réservez votre séjour en quelques clics
            </p>
            <h1 className="mt-3 text-center text-3xl font-bold leading-tight tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] md:text-4xl md:leading-tight">
              Trouvez les services et extras pour votre séjour
            </h1>
          </div>
          <div className="row-start-3 mt-16 w-full max-w-4xl justify-self-center md:mt-20">
            <HomeSearchBar
              mode="services"
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
              serviceType={serviceType}
              onServiceTypeChange={setServiceType}
              minDateIso={todayIsoDate()}
              onSearch={onSearch}
            />
          </div>
        </div>
      </ClientHeroSection>

      {catalogLoaded ? (
        <section className="mx-auto max-w-6xl px-4 py-10 md:px-8" aria-label="Services proposés par les hébergeurs">
          {catalogError ? (
            <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-muted shadow-sm">
              <p className="font-semibold text-ink">Catalogue indisponible</p>
              <p className="mt-2">{catalogError}</p>
              <p className="mt-2 text-xs">Veuillez réessayer dans quelques instants.</p>
            </div>
          ) : !hasCatalog ? (
            <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-muted shadow-sm">
              <p className="font-semibold text-ink">Aucun service dans le catalogue pour le moment</p>
              <p className="mt-2">
                Les services apparaissent ici lorsqu’un hôte les ajoute au catalogue d’un établissement
                <span className="font-medium text-ink"> actif</span> et qu’ils sont marqués comme
                <span className="font-medium text-ink"> disponibles</span>.
              </p>
            </div>
          ) : filteredEmpty ? (
            <div className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-muted shadow-sm">
              <p className="font-semibold text-ink">Aucun résultat pour ces critères</p>
              <p className="mt-2">Essayez un autre mot-clé, ou réinitialisez le type de service.</p>
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  setServiceType('');
                  setDisplayed(allServices);
                }}
                className="mt-4 inline-flex rounded-control bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted">
                  <span className="font-semibold text-ink">{finalList.length}</span> service(s)
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-full border border-line bg-card p-1 text-xs font-semibold">
                    {(
                      [
                        ['ALL', 'Tous'],
                        ['PAID', 'Payants'],
                        ['INCLUDED', 'Inclus'],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setPricingFilter(k);
                          setDisplayed(applyFilters(allServices, keyword, serviceType, k));
                        }}
                        className={`rounded-full px-3 py-1.5 transition ${
                          pricingFilter === k ? 'bg-ink text-white' : 'text-ink hover:bg-surface'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="text-xs font-semibold text-muted">
                    Trier
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as typeof sort)}
                      className="ml-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink"
                    >
                      <option value="RELEVANCE">Pertinence</option>
                      <option value="ALPHA">A → Z</option>
                      <option value="PRICE_ASC">Prix ↑</option>
                      <option value="PRICE_DESC">Prix ↓</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 space-y-8">
                {grouped.map((g) => (
                  <div key={g.categorie}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="text-base font-bold text-ink">{serviceCategoryLabel(g.categorie)}</h2>
                      <span className="text-xs font-semibold text-muted">{g.items.length} service(s)</span>
                    </div>
                    {g.items.length > 3 ? (
                      <p className="mt-1 text-xs text-muted">
                        Affichage réduit : {expandedCategories[g.categorie] ? g.items.length : 3} sur {g.items.length}
                      </p>
                    ) : null}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(expandedCategories[g.categorie] ? g.items : g.items.slice(0, 3)).map((s) => {
                        const ville = s.ville?.trim();
                        const priceUnit = s.unite?.trim() ? ` / ${s.unite.trim()}` : '';
                        const isIncluded = (s.pricingType ?? 'PAID') === 'INCLUDED';
                        return (
                          <article
                            key={s.id}
                            className="flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgb(0_0_0/0.06)]"
                          >
                            <div className="h-40 w-full overflow-hidden bg-surface">
                              <img
                                src={serviceImageUrl(s)}
                                alt={s.libelle}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="p-5">
                              <p className="text-[15px] font-semibold leading-snug text-ink">{s.libelle}</p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    isIncluded ? 'bg-emerald-50 text-emerald-800' : 'bg-surface text-ink'
                                  }`}
                                >
                                  {isIncluded ? '✓ Inclus' : '€ Payant'}
                                </span>
                                {s.disponibilite ? (
                                  <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                                    {disponibiliteLabel(s.disponibilite)}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 text-lg font-semibold text-ink">
                                {isIncluded ? (
                                  'Inclus'
                                ) : (
                                  <>
                                    {formatFCFA(Number(s.prix))}
                                    <span className="text-sm font-normal text-muted">{priceUnit}</span>
                                  </>
                                )}
                              </p>
                              {s.description ? (
                                <p className="mt-2 line-clamp-2 text-sm text-muted">{s.description}</p>
                              ) : null}
                              {isIncluded ? (
                                <>
                                  <p className="mt-3 line-clamp-2 text-sm text-muted">
                                    <span className="font-medium text-ink">{s.etablissementNom}</span>
                                    {ville ? ` · ${ville}` : ''}
                                  </p>
                                  <Link
                                    to={`/etablissement/${s.etablissementId}`}
                                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-ink/90"
                                  >
                                    Voir l&apos;hébergement
                                  </Link>
                                </>
                              ) : (
                                <>
                                  <p className="mt-3 text-sm text-muted">
                                    Service additionnel géré par l’administration.
                                  </p>
                                  <Link
                                    to={`/services/commande?serviceId=${s.id}`}
                                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand/90"
                                  >
                                    Réserver ce service
                                  </Link>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {g.items.length > 3 ? (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          className="rounded-control border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-surface"
                          onClick={() => {
                            setExpandedCategories((prev) => ({ ...prev, [g.categorie]: !prev[g.categorie] }));
                          }}
                        >
                          {expandedCategories[g.categorie] ? 'Afficher moins' : 'Afficher plus'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      <HelpFab />
    </div>
  );
}
