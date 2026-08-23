import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchHealth, getToken } from '../lib/api';
import { storageKey } from '../lib/storageScope';
import { useAuth } from '../context/AuthContext';

export type AiStatus = 'unknown' | 'configured' | 'missing';

interface AiSetupValue {
  status: AiStatus;
  show: boolean;
  check: () => Promise<void>;
  saveKey: (key: string) => Promise<void>;
  dismiss: () => void;
  open: () => void;
}

const AiSetupContext = createContext<AiSetupValue | null>(null);

export function AiSetupProvider({ children }: { children: ReactNode }) {
  const { scope } = useAuth();
  const dismissKey = storageKey(scope, 'aiSetupDismissed');
  const [status, setStatus] = useState<AiStatus>('unknown');
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });
  const [manualOpen, setManualOpen] = useState(false);

  const check = useCallback(async () => {
    const health = await fetchHealth();
    if (!health) return;
    // Le serveur ne renvoie que le statut de la clé du compte courant.
    setStatus(health.hasUserKey ? 'configured' : 'missing');
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const saveKey = useCallback(async (key: string): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch('/api/setup/setup-key', {
      method: 'POST',
      headers,
      body: JSON.stringify({ key: key.trim() }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? 'Erreur lors de l’enregistrement de la clé.');
    }
    setStatus('configured');
    setManualOpen(false);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(dismissKey, '1');
    } catch {
      /* stockage local indisponible */
    }
    setDismissed(true);
    setManualOpen(false);
  }, [dismissKey]);

  const open = useCallback(() => setManualOpen(true), []);

  const value = useMemo<AiSetupValue>(
    () => ({
      status,
      show: (status === 'missing' && !dismissed) || manualOpen,
      check,
      saveKey,
      dismiss,
      open,
    }),
    [status, dismissed, manualOpen, check, saveKey, dismiss, open],
  );

  return <AiSetupContext.Provider value={value}>{children}</AiSetupContext.Provider>;
}

export function useAiSetup(): AiSetupValue {
  const context = useContext(AiSetupContext);
  if (!context) throw new Error('useAiSetup doit être utilisé dans <AiSetupProvider>');
  return context;
}
