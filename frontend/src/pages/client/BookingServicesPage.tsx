import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { BackNavLogo } from '../../components/BackNavLogo';
import { HelpFab } from '../../components/HelpFab';
import { useBooking } from '../../context/BookingContext';
import { getEtablissementDetail, getGlobalServices, type BackendPublicService, type BackendService } from '../../lib/backendApi';
import { formatFCFA } from '../../lib/format';
import { serviceCategoryLabel } from '../../lib/serviceCategories';
import { serviceImageUrl } from '../../lib/serviceImage';

function clampQty(q: number) {
  return Math.max(1, Math.min(99, Math.floor(Number.isFinite(q) ? q : 1) || 1));
}

export function BookingServicesPage() {
  const { draft, setDraft, roomSubtotal, servicesTotal, total, nights } = useBooking();
  const navigate = useNavigate();
  const [serviceToAddId, setServiceToAddId] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(draft.services.map((s) => s.id))
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const line of draft.services) {
      init[line.id] = clampQty(line.quantity);
    }
    return init;
  });
  const [availableServices, setAvailableServices] = useState<BackendService[]>([]);
  const [globalServices, setGlobalServices] = useState<BackendPublicService[]>([]);
  const paidServices = useMemo(
    () => availableServices.filter((s) => s.actif !== false && (s.pricingType ?? 'PAID') === 'PAID'),
    [availableServices]
  );
  const includedServices = useMemo(
    () => availableServices.filter((s) => s.actif !== false && (s.pricingType ?? 'PAID') === 'INCLUDED'),
    [availableServices]
  );
  const globalPaidServices = useMemo(
    () => globalServices.filter((s) => (s.pricingType ?? 'PAID') === 'PAID'),
    [globalServices]
  );
  const extrasById = useMemo(() => {
    const m = new Map<string, { libelle: string; categorie?: string; unite?: string | null; disponibilite?: string; prix: number; imageUrl?: string | null; source: 'ETAB' | 'CATALOGUE' }>();
    for (const s of paidServices) {
      m.set(String(s.id), {
        libelle: s.libelle,
        categorie: s.categorie,
        unite: s.unite ?? null,
        disponibilite: s.disponibilite ? String(s.disponibilite) : undefined,
        prix: s.prix,
        imageUrl: s.imageUrl ?? null,
        source: 'ETAB',
      });
    }
    for (const s of globalPaidServices) {
      m.set(String(s.id), {
        libelle: s.libelle,
        categorie: s.categorie,
        unite: s.unite ?? null,
        disponibilite: s.disponibilite ? String(s.disponibilite) : undefined,
        prix: Number(s.prix),
        imageUrl: s.imageUrl ?? null,
        source: 'CATALOGUE',
      });
    }
    return m;
  }, [paidServices, globalPaidServices]);

  const selectedExtras = useMemo(() => {
    return Array.from(selected)
      .map((id) => {
        const s = extrasById.get(id);
        if (!s) return null;
        const perNuit = !s.unite || s.unite.toLowerCase().includes('nuit');
        const unitPrice = s.prix * (perNuit ? nights : 1);
        const qty = clampQty(quantities[id] ?? 1);
        return {
          id,
          ...s,
          unitPrice,
          qty,
          lineTotal: unitPrice * qty,
        };
      })
      .filter(
        (x): x is {
          id: string;
          libelle: string;
          categorie?: string;
          unite?: string | null;
          disponibilite?: string;
          prix: number;
          imageUrl?: string | null;
          source: 'ETAB' | 'CATALOGUE';
          unitPrice: number;
          qty: number;
          lineTotal: number;
        } => Boolean(x)
      );
  }, [selected, extrasById, nights, quantities]);

  useEffect(() => {
    if (!draft.hotelId) navigate('/');
  }, [draft.hotelId, navigate]);

  useEffect(() => {
    if (!draft.hotelId) return;
    const hotelId = Number(draft.hotelId);
    if (!Number.isFinite(hotelId) || hotelId <= 0) return;

    let alive = true;
    getEtablissementDetail(hotelId)
      .then((detail) => {
        if (!alive) return;
        setAvailableServices(detail.services ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setAvailableServices([]);
      });

    getGlobalServices()
      .then((list) => {
        if (!alive) return;
        setGlobalServices(list ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setGlobalServices([]);
      });

    return () => {
      alive = false;
    };
  }, [draft.hotelId]);

  useEffect(() => {
    const byId = new Map(paidServices.map((s) => [String(s.id), s]));
    const globalById = new Map(globalPaidServices.map((s) => [String(s.id), s]));
    const multiplyByNights = (s: BackendService) =>
      !s.unite || s.unite.toLowerCase().includes('nuit');
    const multiplyByNightsPublic = (s: BackendPublicService) =>
      !s.unite || s.unite.toLowerCase().includes('nuit');

    const lines = Array.from(selected)
      .map((id) => {
        const local = byId.get(id);
        if (local) {
          const sid = String(local.id);
          return {
            id: sid,
            title: local.libelle,
            price: local.prix * (multiplyByNights(local) ? nights : 1),
            quantity: clampQty(quantities[sid] ?? 1),
          };
        }
        const glob = globalById.get(id);
        if (glob) {
          const sid = String(glob.id);
          return {
            id: sid,
            title: glob.libelle,
            price: glob.prix * (multiplyByNightsPublic(glob) ? nights : 1),
            quantity: clampQty(quantities[sid] ?? 1),
          };
        }
        return null;
      })
      .filter((x): x is { id: string; title: string; price: number; quantity: number } => Boolean(x));

    setDraft({ services: lines });
  }, [selected, nights, paidServices, globalPaidServices, quantities, setDraft]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else {
        n.add(id);
        setQuantities((q) => ({ ...q, [id]: q[id] ?? 1 }));
      }
      return n;
    });
  }

  function setQty(id: string, raw: number) {
    setQuantities((prev) => ({ ...prev, [id]: clampQty(raw) }));
  }

  function addSelectedService() {
    const id = serviceToAddId;
    if (!id) return;
    if (!extrasById.has(id)) return;
    setSelected((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    setQuantities((q) => ({ ...q, [id]: q[id] ?? 1 }));
    setServiceToAddId('');
  }

  function removeSelectedService(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <BackNavLogo to="/reservation" label="Retour réservation" />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-card border border-line bg-white p-6 shadow-card">
            <h1 className="text-lg font-bold text-ink">Services additionnels</h1>
            <p className="mt-1 text-sm text-muted">
              Options facturées pour la durée du séjour ({nights} nuit{nights > 1 ? 's' : ''})
            </p>
            <div className="mt-6 space-y-3">
              {paidServices.length === 0 && includedServices.length === 0 && globalPaidServices.length === 0 ? (
                <p className="text-sm text-muted">Aucun service additionnel disponible pour cet établissement.</p>
              ) : (
                <>
                  <div className="rounded-2xl border border-line bg-surface/50 p-4">
                    <p className="text-sm font-bold text-ink">Ajouter des services additionnels</p>
                    <p className="mt-1 text-xs text-muted">Choisissez un service dans la liste, puis cliquez sur Ajouter.</p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <select
                        value={serviceToAddId}
                        onChange={(e) => setServiceToAddId(e.target.value)}
                        className="w-full rounded-control border border-line bg-white px-3 py-2 text-sm text-ink outline-none ring-brand focus:ring-2"
                      >
                        <option value="">Sélectionner un service…</option>
                        {paidServices.length > 0 ? (
                          <optgroup label="Services de l’établissement">
                            {paidServices.map((s) => (
                              <option key={s.id} value={String(s.id)} disabled={selected.has(String(s.id))}>
                                {s.libelle}
                              </option>
                            ))}
                          </optgroup>
                        ) : null}
                        {globalPaidServices.length > 0 ? (
                          <optgroup label="Services en plus (catalogue)">
                            {globalPaidServices.map((s) => (
                              <option key={s.id} value={String(s.id)} disabled={selected.has(String(s.id))}>
                                {s.libelle}
                              </option>
                            ))}
                          </optgroup>
                        ) : null}
                      </select>
                      <button
                        type="button"
                        onClick={addSelectedService}
                        disabled={!serviceToAddId}
                        className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Ajouter
                      </button>
                    </div>

                    {selectedExtras.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {selectedExtras.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-stretch gap-3 rounded-control border border-line bg-white p-3"
                          >
                            <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface">
                              <img src={serviceImageUrl(s)} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-ink">{s.libelle}</p>
                                  <p className="text-sm text-muted">
                                    {s.categorie ? `Catégorie : ${serviceCategoryLabel(s.categorie)}` : 'Service'}
                                    {s.unite ? ` · ${s.unite}` : ''}
                                    {s.disponibilite ? ` · ${s.disponibilite.replaceAll('_', ' ')}` : ''}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSelectedService(s.id)}
                                  className="shrink-0 text-xs font-semibold text-red-700 hover:underline"
                                >
                                  Retirer
                                </button>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <label className="text-xs font-semibold text-muted">
                                  Quantité
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={s.qty}
                                    onChange={(e) => setQty(s.id, Number.parseInt(e.target.value, 10))}
                                    className="ml-2 w-16 rounded border border-line bg-white px-2 py-1 text-sm text-ink"
                                  />
                                </label>
                                <span className="text-sm font-semibold text-ink">
                                  {formatFCFA(s.lineTotal)}
                                  <span className="ml-1 text-xs font-normal text-muted">
                                    ({formatFCFA(s.unitPrice)} × {s.qty})
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted">Aucun service additionnel sélectionné.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="h-fit rounded-card border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
            <h2 className="font-bold text-ink">Récapitulatif</h2>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <div className="flex justify-between">
                <span>Chambre</span>
                <span>{formatFCFA(roomSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Services</span>
                <span>{formatFCFA(servicesTotal)}</span>
              </div>
            </div>
            <hr className="my-4 border-line" />
            <div className="flex justify-between font-bold text-ink">
              <span>Total</span>
              <span className="text-brand">{formatFCFA(total)}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/paiement')}
              className="mt-6 w-full rounded-control bg-ink py-3 text-sm font-semibold text-white"
            >
              Procéder au paiement
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Vous ne serez débité qu&apos;après confirmation
            </p>
          </div>
        </div>
      </div>
      <HelpFab />
    </div>
  );
}
