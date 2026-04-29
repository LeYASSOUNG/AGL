function trimSlashEnd(s: string) {
  return s.replace(/\/+$/, '');
}

/**
 * Base URL for API calls.
 * - Dev default: "/api" (Vite proxy)
 * - Prod: set VITE_API_BASE_URL="https://api.example.com/api"
 *
 * Why this exists:
 * - In dev, we want relative calls (same origin) so Vite can proxy /api to the backend.
 * - In prod, the API may live on another domain; the base URL must be configurable without code changes.
 */
export const API_BASE_URL: string = (() => {
  const v = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (!v || !v.trim()) return '/api';
  // Allow "/api" or "https://..../api"
  return trimSlashEnd(v.trim());
})();

