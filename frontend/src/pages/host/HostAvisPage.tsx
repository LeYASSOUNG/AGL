import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HostModal } from '../../components/host/HostModal';
import { StarRating } from '../../components/StarRating';
import { formatDateFR } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { getAvisByEtablissement, type BackendAvis } from '../../lib/backendApi';

type HostEtablissement = {
  id: number;
  nom: string;
};

type ReplyDraft = {
  avisId: number | null;
  message: string;
};

function formatOptionalDate(date: string | null | undefined) {
  if (!date) return '—';
  return formatDateFR(date);
}

function averageNote(reviews: BackendAvis[]) {
  if (reviews.length === 0) return 0;
  return reviews.reduce((s, r) => s + r.note, 0) / reviews.length;
}

export function HostAvisPage() {
  const { authedFetch } = useAuth();

  const [reviews, setReviews] = useState<BackendAvis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [reply, setReply] = useState<ReplyDraft>({ avisId: null, message: '' });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const establishments = await authedFetch<HostEtablissement[]>('/host/etablissements/mes').then((r) => r.data);
        const enriched = await Promise.all(
          establishments.map(async (e) => {
            const list = await getAvisByEtablissement(e.id);
            return list;
          })
        );

        if (!alive) return;
        setReviews(enriched.flat());
      } catch (e2) {
        if (!alive) return;
        setError(e2 instanceof Error ? e2.message : 'Chargement impossible');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const avg = averageNote(reviews);
    const rounded = Math.round(avg * 10) / 10;
    const countsByNote: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      if (r.note >= 1 && r.note <= 5) countsByNote[r.note] = (countsByNote[r.note] ?? 0) + 1;
    }
    return { total: reviews.length, avg: rounded, countsByNote };
  }, [reviews]);

  function openReply(a: BackendAvis) {
    setReply({ avisId: a.id, message: '' });
    setModalOpen(true);
  }

  async function submitReply() {
    if (reply.avisId == null) return;
    const msg = reply.message.trim();
    if (!msg) return;

    const updated = await authedFetch<BackendAvis>(`/avis/${reply.avisId}`, {
      method: 'PUT',
      body: JSON.stringify({ reponseHote: msg }),
    }).then((r) => r.data);

    setReviews((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setModalOpen(false);
    setReply({ avisId: null, message: '' });
  }

  async function deleteAvis(id: number) {
    await authedFetch(`/avis/${id}`, { method: 'DELETE' }).then(() => undefined);
    setReviews((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <h1 className="text-2xl font-bold text-ink">Gestion des avis</h1>
      <p className="mt-1 text-sm text-muted">Analysez vos retours et répondez aux voyageurs.</p>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Chargement…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-card border border-line bg-surface p-5">
            <div className="flex items-start gap-4">
              <div>
                <p className="text-sm font-semibold text-muted">Note moyenne</p>
                <p className="mt-1 text-4xl font-bold text-ink">{stats.avg.toFixed(1)}</p>
              </div>
              <div className="pt-2">
                <StarRating value={stats.avg} />
                <p className="mt-1 text-xs text-muted">Basé sur {stats.total} avis</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {([1, 2, 3, 4, 5] as const).map((note) => {
                const count = stats.countsByNote[note] ?? 0;
                const width = stats.total === 0 ? 0 : (count / stats.total) * 100;
                return (
                  <div key={note} className="flex items-center gap-3">
                    <span className="w-8 text-xs font-semibold text-ink">{note}★</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded bg-white border border-line">
                      <div className="h-full bg-brand" style={{ width: `${width}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">Aucun avis pour l&apos;instant.</p>
            ) : (
              reviews.map((a) => (
                <div key={a.id} className="rounded-card border border-line bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Client #{a.auteurId}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatOptionalDate(a.dateReponse ?? a.createdAt ?? null)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <StarRating value={a.note} />
                        <span className="text-sm font-semibold text-ink">{a.note}/5</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted">{a.commentaire}</p>

                  {a.reponseHote ? (
                    <div className="mt-4 rounded-control bg-brand/5 p-4 text-sm">
                      <p className="font-semibold text-ink">Réponse de l&apos;hôte</p>
                      <p className="mt-1 text-muted">{a.reponseHote}</p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-white"
                      onClick={() => openReply(a)}
                    >
                      Répondre à l&apos;avis
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-control border border-line bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => void deleteAvis(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      )}

      <HostModal
        open={modalOpen}
        title="Répondre à l'avis"
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-control border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!reply.message.trim()}
              onClick={() => void submitReply()}
            >
              Envoyer
            </button>
          </div>
        }
      >
        <label className="block text-sm font-semibold text-ink">
          Votre réponse
          <textarea
            value={reply.message}
            onChange={(e) => setReply((p) => ({ ...p, message: e.target.value }))}
            className="mt-2 min-h-[140px] w-full resize-none rounded-control bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-brand focus:ring-2"
            placeholder="Bonjour, merci pour votre retour..."
          />
        </label>
      </HostModal>
    </div>
  );
}

