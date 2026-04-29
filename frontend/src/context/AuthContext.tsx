import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { API_BASE_URL } from '../lib/apiBase';

export type AuthUser = {
  prenom: string;
  nom: string;
  email: string;
  roles: string[];
  telephone?: string;
  avatarUrl?: string;
  id?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  login: (args: { email: string; motDePasse: string }) => Promise<AuthUser>;
  register: (args: {
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
    motDePasse: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  authedFetch: <T>(
    path: string,
    init?: RequestInit
  ) => Promise<{ data: T; response: Response }>;
  /** Rafraîchit l’access token (rôles à jour en BD) puis resynchronise le profil affiché. */
  syncSessionFromServer: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('ql_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ql_access');
    } catch {
      return null;
    }
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ql_refresh');
    } catch {
      return null;
    }
  });

  const [isReady, setIsReady] = useState(false);

  // Synchronise localStorage sur user/tokens
  useEffect(() => {
    if (!isReady) return;
    try {
      if (user) localStorage.setItem('ql_user', JSON.stringify(user));
      else localStorage.removeItem('ql_user');
      if (accessToken) localStorage.setItem('ql_access', accessToken);
      else localStorage.removeItem('ql_access');
      if (refreshToken) localStorage.setItem('ql_refresh', refreshToken);
      else localStorage.removeItem('ql_refresh');
    } catch {
      // ignore
    }
  }, [user, accessToken, refreshToken, isReady]);

  // Une fois monté, on considère le contexte "prêt" (pour éviter des rendus init trop tôt)
  useEffect(() => {
    setIsReady(true);
  }, []);

  const logout = useCallback(async () => {
    const rt = refreshToken;
    try {
      if (rt) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
      }
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      try {
        localStorage.removeItem('ql_user');
        localStorage.removeItem('ql_access');
        localStorage.removeItem('ql_refresh');
      } catch {
        // ignore
      }
    }
  }, [refreshToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const json = (await res.json()) as { accessToken: string; tokenType: string };
    setAccessToken(json.accessToken);
    return json.accessToken;
  }, [refreshToken]);

  const authedFetch = useCallback(
    async function authedFetch<T>(
      path: string,
      init: RequestInit = {}
    ): Promise<{ data: T; response: Response }> {
      // Centralized fetch wrapper:
      // - injects Authorization: Bearer <accessToken>
      // - retries once on 401 by calling /auth/refresh
      // - logs the user out if refresh fails
      const doFetch = async (token: string | null) => {
        const headers = new Headers(init.headers || {});
        headers.set('Content-Type', 'application/json');
        if (token) headers.set('Authorization', `Bearer ${token}`);
        const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
          ...init,
          headers,
        });
        return response;
      };

      let token = accessToken;
      let response = await doFetch(token);

      if (response.status === 401) {
        // Tentative refresh unique
        try {
          token = await refreshAccessToken();
          response = await doFetch(token);
        } catch {
          await logout();
          throw new Error('Unauthorized');
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        let message = `HTTP ${response.status}`;
        if (errText) {
          try {
            const err = JSON.parse(errText) as Record<string, unknown>;
            if (typeof err.message === 'string' && err.message.length > 0) {
              message = err.message;
            } else if (err.errors != null && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
              const fieldErrors = err.errors as Record<string, string>;
              const parts = Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`);
              if (parts.length > 0) {
                message = parts.join(' · ');
              } else if (typeof err.error === 'string') {
                message = err.error;
              }
            } else if (typeof err.error === 'string' && err.error.length > 0) {
              message = err.error;
            }
          } catch {
            if (response.status === 413 || /too large|request entity/i.test(errText)) {
              message = 'Fichier ou requête trop volumineuse pour le serveur.';
            } else if (errText.length < 400) {
              message = errText.trim() || message;
            }
          }
        }
        throw new Error(message);
      }

      const text = await response.text();
      let data: T;
      try {
        data = (text && text.length > 0 ? JSON.parse(text) : ({} as T)) as T;
      } catch {
        throw new Error('Réponse du serveur non comprise (JSON invalide).');
      }
      return { data, response };
    },
    [accessToken, refreshAccessToken, logout]
  );

  const syncSessionFromServer = useCallback(async () => {
    const token = await refreshAccessToken();
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return;
    const profile = (await res.json()) as {
      id?: number;
      prenom: string;
      nom: string;
      email: string;
      telephone?: string;
      avatarUrl?: string;
      roles?: string[];
    };
    setUser((prev) => ({
      prenom: profile.prenom,
      nom: profile.nom,
      email: profile.email,
      telephone: profile.telephone,
      avatarUrl: profile.avatarUrl,
      id: profile.id ?? prev?.id,
      roles: profile.roles?.length ? profile.roles : (prev?.roles ?? []),
    }));
  }, [refreshAccessToken]);

  const login = useCallback(
    async ({ email, motDePasse }: { email: string; motDePasse: string }) => {
      let res: Response;
      try {
        res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, motDePasse }),
        });
      } catch {
        throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
      }
      if (!res.ok) {
        let message = `Connexion refusée (HTTP ${res.status})`;
        try {
          const err = (await res.json()) as { message?: string; error?: string };
          if (typeof err.message === 'string' && err.message.trim()) {
            message = err.message.trim();
          }
        } catch {
          if (res.status >= 500) {
            message = 'Erreur serveur. Veuillez réessayer plus tard.';
          }
        }
        throw new Error(message);
      }
      const json = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        user: AuthUser;
      };
      setAccessToken(json.accessToken);
      setRefreshToken(json.refreshToken);
      setUser(json.user);

      return json.user;
    },
    []
  );

  const register = useCallback(
    async ({
      prenom,
      nom,
      email,
      telephone,
      motDePasse,
    }: {
      prenom: string;
      nom: string;
      email: string;
      telephone?: string;
      motDePasse: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, email, telephone, motDePasse }),
      });
      if (!res.ok) throw new Error("Inscription impossible. Vérifiez vos informations et réessayez.");
      const json = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        user: AuthUser;
      };
      setAccessToken(json.accessToken);
      setRefreshToken(json.refreshToken);
      setUser(json.user);

      return json.user;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isReady,
      login,
      register,
      logout,
      authedFetch,
      syncSessionFromServer,
    }),
    [user, accessToken, refreshToken, isReady, login, register, logout, authedFetch, syncSessionFromServer]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
