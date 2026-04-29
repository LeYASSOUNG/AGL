import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plane,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getEtablissementVilles, getPublicServices } from '../lib/backendApi';
import { SERVICE_CATEGORY_LABELS, SERVICE_CATEGORY_ORDER } from '../lib/serviceCategories';

type OpenPanel = 'destination' | 'dates' | 'voyageurs' | 'serviceType' | null;
type DateMode = 'dates' | 'flex';
type FlexSlack = 0 | 1 | 2 | 3 | 7 | 14;

export type HomeSearchBarProps = {
  /** Logements : voyageurs. Services : type de service à la place du 3e segment. */
  mode?: 'lodging' | 'services';
  keyword: string;
  onKeywordChange: (v: string) => void;
  dateArrivee: string;
  dateDepart: string;
  onDatesChange: (arrivee: string, depart: string) => void;
  adults: number;
  kids: number;
  infants: number;
  pets: number;
  onGuestsChange: (g: { adults: number; kids: number; infants: number; pets: number }) => void;
  /** Identifiant du type (ex. spa) ; chaîne vide = tous */
  serviceType?: string;
  onServiceTypeChange?: (id: string) => void;
  minDateIso: string;
  onSearch: () => void;
  /** `white` : barre blanche flottante sur image (accueil / services). */
  surface?: 'muted' | 'white';
};

type Suggestion = {
  id: string;
  title: string;
  subtitle: string;
  fill: string;
  Icon: LucideIcon;
};

export const SERVICE_TYPE_OPTIONS: { id: string; label: string; subtitle: string; fill: string; Icon: LucideIcon }[] =
  [
    { id: '', label: 'Tous les services', subtitle: 'Sans filtre sur le type', fill: 'bg-neutral-200 text-neutral-700', Icon: Sparkles },
  ];

const DESTINATION_FILLS = [
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-800',
  'bg-cyan-100 text-cyan-800',
  'bg-emerald-100 text-emerald-800',
  'bg-indigo-100 text-indigo-800',
] as const;

function prettyCategory(label: string) {
  const raw = String(label ?? '').trim();
  if (!raw) return '';
  return raw.replaceAll('_', ' ').toLowerCase();
}

function categoryFill(i: number) {
  const fills = ['bg-neutral-200 text-neutral-700', 'bg-slate-100 text-slate-800', 'bg-blue-100 text-blue-800', 'bg-violet-100 text-violet-800'] as const;
  return fills[Math.abs(i) % fills.length]!;
}

function toIsoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthMatrix(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const WEEK_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function StepRow({
  title,
  subtitle,
  value,
  min,
  max,
  onChange,
  footer,
}: {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  footer?: ReactNode;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="border-b border-line py-5 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          {footer}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={dec}
            disabled={value <= min}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:border-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Diminuer ${title}`}
          >
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="min-w-[1.25rem] text-center text-base font-medium tabular-nums text-ink">{value}</span>
          <button
            type="button"
            onClick={inc}
            disabled={value >= max}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:border-muted disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Augmenter ${title}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  year,
  month,
  minDateIso,
  arrivee,
  depart,
  onPick,
}: {
  year: number;
  month: number;
  minDateIso: string;
  arrivee: string;
  depart: string;
  onPick: (iso: string) => void;
}) {
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const label = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const labelTitle = label.charAt(0).toUpperCase() + label.slice(1);

  function inRange(iso: string) {
    if (!arrivee || !depart || depart <= arrivee) return iso === arrivee;
    return iso >= arrivee && iso <= depart;
  }

  function isEdge(iso: string) {
    return iso === arrivee || iso === depart;
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-3 text-center text-sm font-semibold capitalize text-ink">{labelTitle}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-muted">
        {WEEK_FR.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-0.5">
        {cells.map((d) => {
          const iso = toIsoLocal(d);
          const inMonth = d.getMonth() === month;
          const past = iso < minDateIso;
          const range = inRange(iso);
          const edge = isEdge(iso);
          return (
            <button
              key={iso + String(d.getTime())}
              type="button"
              disabled={past}
              onClick={() => !past && onPick(iso)}
              className={[
                'relative flex h-9 items-center justify-center rounded-full text-sm transition',
                !inMonth ? 'text-muted/40' : past ? 'cursor-not-allowed text-muted/35' : 'text-ink',
                range && inMonth && !past ? 'bg-black/[0.06]' : '',
                edge && inMonth && !past ? 'bg-ink font-semibold text-white hover:bg-ink' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function voyageursLine(a: number, k: number, i: number, p: number) {
  if (a === 2 && k === 0 && i === 0 && p === 0) return '2 adultes';
  const parts: string[] = [];
  if (a > 0) parts.push(`${a} adulte${a > 1 ? 's' : ''}`);
  if (k > 0) parts.push(`${k} enfant${k > 1 ? 's' : ''}`);
  if (i > 0) parts.push(`${i} bébé${i > 1 ? 's' : ''}`);
  if (p > 0) parts.push(`${p} animal${p > 1 ? 'aux' : ''}`);
  return parts.length ? parts.join(' · ') : 'Ajouter des voyageurs';
}

function serviceTypeSummary(serviceType: string, options: { id: string; label: string }[]) {
  if (!serviceType) return 'Choisir un type';
  return options.find((o) => o.id === serviceType)?.label ?? prettyCategory(serviceType) ?? 'Type de service';
}

function datesLine(arrivee: string, depart: string) {
  if (!arrivee && !depart) return 'Quand ?';
  if (arrivee && !depart) {
    const a = new Date(`${arrivee}T12:00:00`);
    return `Départ le… · ${a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  }
  if (arrivee && depart && depart > arrivee) {
    const a = new Date(`${arrivee}T12:00:00`);
    const b = new Date(`${depart}T12:00:00`);
    const fa = a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const fb = b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${fa} – ${fb}`;
  }
  return 'Quand ?';
}

export function HomeSearchBar({
  mode = 'lodging',
  keyword,
  onKeywordChange,
  dateArrivee,
  dateDepart,
  onDatesChange,
  adults,
  kids,
  infants,
  pets,
  onGuestsChange,
  serviceType = '',
  onServiceTypeChange,
  minDateIso,
  onSearch,
  surface = 'muted',
}: HomeSearchBarProps) {
  const isServices = mode === 'services';
  const onHero = surface === 'white';
  const rootRef = useRef<HTMLDivElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [destinations, setDestinations] = useState<Suggestion[]>([]);
  const [serviceTypes, setServiceTypes] = useState<{ id: string; label: string; subtitle: string; fill: string; Icon: LucideIcon }[]>(SERVICE_TYPE_OPTIONS);
  const [dateMode, setDateMode] = useState<DateMode>('dates');
  const [flexSlack, setFlexSlack] = useState<FlexSlack>(0);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    let alive = true;
    getEtablissementVilles()
      .then((villes) => {
        if (!alive) return;
        const mapped: Suggestion[] = villes.map((v, i) => ({
          id: v.toLowerCase(),
          title: v,
          subtitle: 'Destination disponible',
          fill: DESTINATION_FILLS[i % DESTINATION_FILLS.length]!,
          Icon: Building2,
        }));
        setDestinations(mapped);
      })
      .catch(() => {
        if (!alive) return;
        setDestinations([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!isServices) return;
    getPublicServices()
      .then((list) => {
        if (!alive) return;
        const fromApi = Array.from(
          new Set(
            list
              .map((s) => (s.categorie ?? '').trim())
              .filter((c) => c.length > 0)
              .map((c) => c.toUpperCase()),
          ),
        );
        const staticIds = new Set(SERVICE_CATEGORY_ORDER.map((x) => String(x)));
        const legacyExtras = fromApi.filter((c) => !staticIds.has(c)).sort((a, b) => a.localeCompare(b, 'fr'));
        const opts = [
          SERVICE_TYPE_OPTIONS[0]!,
          ...SERVICE_CATEGORY_ORDER.map((id, i) => ({
            id,
            label: SERVICE_CATEGORY_LABELS[id] ?? prettyCategory(id),
            subtitle: 'Catégorie de service',
            fill: categoryFill(i),
            Icon: Plane,
          })),
          ...legacyExtras.map((c, j) => ({
            id: c,
            label: prettyCategory(c) || c,
            subtitle: 'Catégorie (données existantes)',
            fill: categoryFill(SERVICE_CATEGORY_ORDER.length + j),
            Icon: Plane,
          })),
        ];
        setServiceTypes(opts);
      })
      .catch(() => {
        if (!alive) return;
        setServiceTypes(SERVICE_TYPE_OPTIONS);
      });
    return () => {
      alive = false;
    };
  }, [isServices]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) {
        setOpenPanel(null);
      }
    }
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  useEffect(() => {
    if (openPanel === 'destination') {
      destInputRef.current?.focus();
    }
  }, [openPanel]);

  function bumpMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function handleDayPick(iso: string) {
    if (!dateArrivee || (dateArrivee && dateDepart)) {
      onDatesChange(iso, '');
      return;
    }
    if (iso <= dateArrivee) {
      onDatesChange(iso, '');
      return;
    }
    onDatesChange(dateArrivee, iso);
  }

  const filteredSuggestions = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.id.includes(q),
    );
  }, [keyword, destinations]);

  const nextYM = useMemo(() => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }, [viewYear, viewMonth]);

  function segmentClass(active: boolean) {
    if (onHero) {
      return [
        'flex min-h-[3.25rem] flex-1 flex-col justify-center px-4 py-2.5 text-left transition md:min-h-[3.5rem] md:px-6',
        active ? 'rounded-2xl bg-neutral-100 shadow-inner md:rounded-full' : 'rounded-2xl hover:bg-neutral-50 md:rounded-full',
        'cursor-pointer',
      ].join(' ');
    }
    return [
      'flex min-h-[3.25rem] flex-1 flex-col justify-center rounded-2xl px-5 py-2.5 text-left transition md:min-h-[3.5rem] md:rounded-full md:px-6',
      active ? 'bg-white shadow-[0_2px_12px_rgb(0_0_0/0.08)]' : 'hover:bg-black/[0.04]',
      'cursor-pointer',
    ].join(' ');
  }

  const labelClass = onHero
    ? 'text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500'
    : 'text-xs font-bold text-ink';

  return (
    <div
      ref={rootRef}
      className={`relative isolate mx-auto mt-8 max-w-5xl ${openPanel ? 'z-[200]' : 'z-0'}`}
    >
      <div
        className={
          onHero
            ? 'flex flex-col gap-2 rounded-[2rem] bg-white p-2 shadow-[0_10px_40px_rgb(0_0_0/0.15)] ring-1 ring-black/[0.05] md:flex-row md:items-stretch md:rounded-full md:p-1.5'
            : 'flex flex-col gap-2 rounded-3xl bg-[#ebebeb] p-2 shadow-[0_6px_24px_rgb(0_0_0/0.12)] md:flex-row md:items-stretch md:rounded-full md:p-1.5'
        }
      >
        <div
          className={`flex min-h-0 flex-1 flex-col md:flex-row md:items-stretch ${
            onHero ? 'md:divide-x md:divide-neutral-200' : ''
          }`}
        >
          {/* Destination : pas de <button> (champ texte). Clic hors input = ouvrir/fermer le panneau. */}
          <div
            className={segmentClass(openPanel === 'destination')}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName === 'INPUT') return;
              setOpenPanel((p) => (p === 'destination' ? null : 'destination'));
            }}
          >
            <span className={labelClass}>Destination</span>
            <input
              ref={destInputRef}
              placeholder={onHero ? 'Rechercher une desti…' : 'Rechercher une destination'}
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onFocus={() => setOpenPanel('destination')}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 w-full min-w-0 cursor-text border-0 bg-transparent p-0 text-left text-sm text-ink placeholder:text-muted/80 outline-none ring-0 focus:ring-0"
            />
          </div>

          {/* Dates */}
          <button
            type="button"
            className={segmentClass(openPanel === 'dates')}
            onClick={() => setOpenPanel((p) => (p === 'dates' ? null : 'dates'))}
          >
            <span className={labelClass}>Dates</span>
            <span className="mt-0.5 line-clamp-1 text-sm text-muted">{datesLine(dateArrivee, dateDepart)}</span>
          </button>

          {/* Voyageurs (logements) ou type de service (page Services) */}
          <button
            type="button"
            className={segmentClass(isServices ? openPanel === 'serviceType' : openPanel === 'voyageurs')}
            onClick={() =>
              setOpenPanel((p) => {
                const key = isServices ? 'serviceType' : 'voyageurs';
                return p === key ? null : key;
              })
            }
          >
            <span className={labelClass}>{isServices ? 'Type de service' : 'Voyageurs'}</span>
            <span className="mt-0.5 line-clamp-1 text-sm text-muted">
              {isServices ? serviceTypeSummary(serviceType, serviceTypes) : voyageursLine(adults, kids, infants, pets)}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpenPanel(null);
            onSearch();
          }}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#FF385C] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#E31C5F] md:my-0.5 md:rounded-full md:py-0 ${
            onHero ? 'md:ml-1' : ''
          }`}
        >
          <Search className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          Rechercher
        </button>
      </div>

      {openPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[9999] md:left-0 md:right-0">
          <div className="max-h-[min(85vh,640px)] overflow-y-auto rounded-3xl border border-black/[0.08] bg-white shadow-[0_12px_40px_rgb(0_0_0/0.15)]">
            {openPanel === 'destination' ? (
              <div className="p-5 md:p-6">
                <p className="text-sm font-semibold text-ink">Suggestions de destinations</p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onKeywordChange(keyword.trim());
                        setOpenPanel(null);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-black/[0.04]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-neutral-700">
                        <Search className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink">
                          {keyword.trim() ? `Rechercher « ${keyword.trim()} »` : 'Saisir une destination'}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">Lancer la recherche avec ce texte</span>
                      </span>
                    </button>
                  </li>
                  {filteredSuggestions.map((s) => {
                    const Icon = s.Icon;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            const q = s.title.split(',')[0]?.trim() ?? s.title;
                            onKeywordChange(q);
                            setOpenPanel(null);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-black/[0.04]"
                        >
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.fill}`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-ink">{s.title}</span>
                            <span className="mt-0.5 block text-sm text-muted">{s.subtitle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {openPanel === 'dates' ? (
              <div className="p-5 md:p-6">
                <div className="mx-auto inline-flex rounded-full bg-[#ebebeb] p-1">
                  <button
                    type="button"
                    onClick={() => setDateMode('dates')}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      dateMode === 'dates' ? 'bg-white text-ink shadow-sm' : 'text-muted'
                    }`}
                  >
                    Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('flex')}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      dateMode === 'flex' ? 'bg-white text-ink shadow-sm' : 'text-muted'
                    }`}
                  >
                    Flexible
                  </button>
                </div>

                {dateMode === 'dates' ? (
                  <>
                    <div className="mt-5 flex items-start justify-between gap-4 md:gap-8">
                      <button
                        type="button"
                        onClick={() => bumpMonth(-1)}
                        className="mt-8 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink hover:bg-surface"
                        aria-label="Mois précédent"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 md:grid-cols-2">
                        <MonthGrid
                          year={viewYear}
                          month={viewMonth}
                          minDateIso={minDateIso}
                          arrivee={dateArrivee}
                          depart={dateDepart}
                          onPick={handleDayPick}
                        />
                        <MonthGrid
                          year={nextYM.y}
                          month={nextYM.m}
                          minDateIso={minDateIso}
                          arrivee={dateArrivee}
                          depart={dateDepart}
                          onPick={handleDayPick}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => bumpMonth(1)}
                        className="mt-8 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink hover:bg-surface"
                        aria-label="Mois suivant"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                      {(
                        [
                          [0, 'Dates exactes'],
                          [1, '± 1 jour'],
                          [2, '± 2 jours'],
                          [3, '± 3 jours'],
                          [7, '± 7 jours'],
                          [14, '± 14 jours'],
                        ] as const
                      ).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFlexSlack(v)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition md:text-sm ${
                            flexSlack === v
                              ? 'border-ink bg-white text-ink'
                              : 'border-line bg-white text-muted hover:border-muted'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-6 text-center text-sm text-muted">
                    Indiquez des dates précises pour affiner les disponibilités, ou revenez à l’onglet « Dates »
                    pour choisir un séjour classique.
                  </p>
                )}
              </div>
            ) : null}

            {openPanel === 'voyageurs' ? (
              <div className="px-5 py-2 md:px-8 md:py-4">
                <StepRow
                  title="Adultes"
                  subtitle="13 ans et plus"
                  value={adults}
                  min={1}
                  max={16}
                  onChange={(n) => onGuestsChange({ adults: n, kids, infants, pets })}
                />
                <StepRow
                  title="Enfants"
                  subtitle="De 2 à 12 ans"
                  value={kids}
                  min={0}
                  max={8}
                  onChange={(n) => onGuestsChange({ adults, kids: n, infants, pets })}
                />
                <StepRow
                  title="Bébés"
                  subtitle="Moins de 2 ans"
                  value={infants}
                  min={0}
                  max={5}
                  onChange={(n) => onGuestsChange({ adults, kids, infants: n, pets })}
                />
                <StepRow
                  title="Animaux domestiques"
                  subtitle="Selon les règles de chaque établissement"
                  value={pets}
                  min={0}
                  max={5}
                  onChange={(n) => onGuestsChange({ adults, kids, infants, pets: n })}
                  footer={
                    <button
                      type="button"
                      className="mt-2 text-left text-xs font-medium text-muted underline decoration-muted/60 underline-offset-2 hover:text-ink"
                    >
                      Vous voyagez avec un animal d&apos;assistance ?
                    </button>
                  }
                />
              </div>
            ) : null}

            {openPanel === 'serviceType' ? (
              <div className="p-5 md:p-6">
                <p className="text-sm font-semibold text-ink">Type de service</p>
                <p className="mt-1 text-sm text-muted">Choisissez une catégorie pour orienter la recherche.</p>
                <ul className="mt-4 space-y-1">
                  {serviceTypes.map((opt) => {
                    const Icon = opt.Icon;
                    const selected = opt.id === serviceType;
                    return (
                      <li key={opt.id || 'all'}>
                        <button
                          type="button"
                          onClick={() => {
                            onServiceTypeChange?.(opt.id);
                            setOpenPanel(null);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-black/[0.04] ${
                            selected ? 'ring-2 ring-brand/40' : ''
                          }`}
                        >
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${opt.fill}`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-ink">{opt.label}</span>
                            <span className="mt-0.5 block text-sm text-muted">{opt.subtitle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
