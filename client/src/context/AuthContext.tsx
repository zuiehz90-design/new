import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  apiAnonymous,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiUpdateProfile,
  getToken,
  setToken,
  type User,
  type UserProfile,
} from '../lib/api';
import { claimPendingData } from '../lib/storageScope';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  /** Identité de stockage local : 'guest' (invité) ou 'u{id}' (compte). */
  scope: string;
  register: (name: string, password: string) => Promise<void>;
  login: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: { name?: string; profile?: UserProfile }) => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  scope: 'guest',
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface BootstrapResult {
  user: User;
  token?: string;
}

/** Session existante -> compte ; sinon creation automatique d'un profil fantome. */
async function bootstrap(): Promise<BootstrapResult | null> {
  const hadToken = Boolean(getToken());
  if (hadToken) {
    const me = await apiMe();
    if (me) return { user: me };
    // Ne jamais remplacer un compte valide par un profil fantome pendant
    // un réveil lent de Render : apiMe conserve le token hors 401.
    if (getToken()) return null;
  }
  try {
    const res = await apiAnonymous({ persist: false });
    return { user: res.user, token: res.token };
  } catch {
    // Serveur indisponible : mode invité local (données conservées sur l'appareil)
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const authGeneration = useRef(0);
  // Toujours « loading » au depart : un profil (fantome si besoin) est cree
  // automatiquement avant le premier affichage — plus de mode invite « vide ».
  const [loading, setLoading] = useState(true);
  const scope = user ? `u${user.id}` : 'guest';

  useEffect(() => {
    let cancelled = false;
    const hadTokenAtStart = Boolean(getToken());
    let retry = 0;

    const hydrate = async (): Promise<void> => {
      const generation = authGeneration.current;
      const result = await bootstrap();
      if (cancelled || generation !== authGeneration.current) return;
      if (result) {
        if (result.token) setToken(result.token);
        claimPendingData(result.user.id);
        setUser(result.user);
        setLoading(false);
        return;
      }

      // Une session existante peut simplement être ralentie par le réveil.
      // On réessaie sans créer de profil fantome supplémentaire.
      if (hadTokenAtStart && getToken() && retry < 2) {
        retry += 1;
        window.setTimeout(() => { void hydrate(); }, 2_000);
        return;
      }
      setLoading(false);
    };

    void hydrate();
    // Affiche rapidement l'interface locale pendant le réveil Render.
    const fallback = window.setTimeout(() => setLoading(false), 1_800);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  const register = useCallback(async (name: string, password: string) => {
    authGeneration.current += 1;
    const res = await apiRegister(name, password);
    claimPendingData(res.user.id);
    setUser(res.user);
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    authGeneration.current += 1;
    const res = await apiLogin(name, password);
    claimPendingData(res.user.id);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    authGeneration.current += 1;
    await apiLogout();
    // Un nouveau profil fantome est cree immediatement : on garde la promesse
    // « un profil des le chargement » meme apres une deconnexion.
    let ghost: User | null = null;
    try {
      const res = await apiAnonymous({ persist: false });
      setToken(res.token);
      claimPendingData(res.user.id);
      ghost = res.user;
    } catch {
      // Hors ligne : on reste en mode invite local
    }
    setUser(ghost);
  }, []);

  const updateProfile = useCallback(async (patch: { name?: string; profile?: UserProfile }) => {
    const updated = await apiUpdateProfile(patch);
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({ user, loading, scope, register, login, logout, updateProfile }),
    [user, loading, scope, register, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
