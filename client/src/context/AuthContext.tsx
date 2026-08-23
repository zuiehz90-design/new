import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  apiAnonymous,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiUpdateProfile,
  getToken,
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

/** Session existante -> compte ; sinon creation automatique d'un profil fantome. */
async function bootstrap(): Promise<User | null> {
  const me = await apiMe();
  if (me) return me;
  try {
    const res = await apiAnonymous();
    return res.user;
  } catch {
    // Serveur indisponible : mode invite local (donnees conservees sur l'appareil)
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Toujours « loading » au depart : un profil (fantome si besoin) est cree
  // automatiquement avant le premier affichage — plus de mode invite « vide ».
  const [loading, setLoading] = useState(true);
  const scope = user ? `u${user.id}` : 'guest';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Garde-fou : ne jamais rester bloque sur l'ecran de chargement
      const timeout = new Promise<null>((r) => setTimeout(() => r(null), 5000));
      const result = await Promise.race([bootstrap(), timeout]);
      if (cancelled) return;
      if (result) claimPendingData(result.id);
      setUser(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (name: string, password: string) => {
    const res = await apiRegister(name, password);
    claimPendingData(res.user.id);
    setUser(res.user);
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    const res = await apiLogin(name, password);
    claimPendingData(res.user.id);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    // Un nouveau profil fantome est cree immediatement : on garde la promesse
    // « un profil des le chargement » meme apres une deconnexion.
    let ghost: User | null = null;
    try {
      const res = await apiAnonymous();
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
