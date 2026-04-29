/**
 * Chemin interne sûr pour navigate() / <Navigate /> (évite les redirections ouvertes).
 * Accepte uniquement une route relative commençant par un seul « / ».
 */
export function safeAppPath(candidate: string | null | undefined): string | null {
  if (candidate == null || typeof candidate !== 'string') return null;
  const t = candidate.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return null;
  return t;
}
