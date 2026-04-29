export function formatFCFA(n: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
}

/**
 * Affiche une date en français. Accepte une date seule `YYYY-MM-DD` ou un instant ISO (`...T...Z`).
 */
export function formatDateFR(iso: string): string {
  if (!iso) return '';
  const trimmed = iso.trim();
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    d = new Date(`${trimmed}T12:00:00`);
  } else {
    d = new Date(trimmed);
  }
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
