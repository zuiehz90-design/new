import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalStorage } from './useLocalStorage';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { storageKey } from '../lib/storageScope';
import { chatStream, type ApiChatMessage, apiGetConversations, apiSaveConversations } from '../lib/api';
import { decideSync } from '../lib/chatSync';
import { moderate, MODERATION_REASONS } from '../lib/moderation';
import { getOfflineAnswer, OFFLINE_FALLBACK } from '../lib/offline';
import type { ChatMessage, Conversation } from '../lib/types';

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat() {
  const { scope, user } = useAuth();
  const { pathname } = useLocation();
  // Les profils fantomes demarrent toujours avec un chat vide et ne persistent
  // rien : seul un compte connecte garde ses anciennes conversations.
  const isAnon = user?.isAnonymous === true;
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(isAnon ? null : storageKey(scope, 'conversations'), []);
  const [activeId, setActiveId] = useLocalStorage<string | null>(isAnon ? null : storageKey(scope, 'activeChat'), null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interrupted, setInterrupted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { settings } = useSettings();

  // ---- Synchronisation avec le compte (le serveur fait foi, dernier écrit gagne) ----
  const conversationsRef = useRef(conversations);
  const hydratedRef = useRef(scope === 'guest');
  const wasAnonRef = useRef(isAnon);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Hydratation : au chargement d'un compte, on compare avec le serveur
  useEffect(() => {
    // L'historique n'est utile que dans Chat : ne pas bloquer les autres pages
    // avec une requête Neon supplémentaire au premier affichage.
    if (pathname !== '/chat' || scope === 'guest' || isAnon || hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const server = await apiGetConversations();
        if (cancelled) return;
        // Un fantome converti en compte ne garde pas le chat de sa session :
        // on repart des anciens messages du compte (le serveur fait foi).
        const converted = wasAnonRef.current;
        wasAnonRef.current = false;
        const local = converted ? [] : conversationsRef.current;
        const decision = decideSync(local, server);
        if (decision === 'download') {
          setConversations(server);
          setActiveId((prev) => (prev && server.some((c) => c.id === prev) ? prev : null));
        } else if (decision === 'upload') {
          await apiSaveConversations(local);
        }
      } catch {
        /* hors ligne : on garde les donnees locales */
      }
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, scope, isAnon, setConversations, setActiveId]);

  // Envoi differe : chaque modification est poussee au serveur (debounce 800 ms)
  useEffect(() => {
    if (scope === 'guest' || isAnon || !hydratedRef.current) return;
    const t = setTimeout(() => {
      void apiSaveConversations(conversations).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [conversations, scope, isAnon]);

  // Retour des anciens messages : un compte qui a des conversations mais
  // aucune conversation ouverte voit automatiquement la plus recente.
  useEffect(() => {
    if (isAnon || scope === 'guest') return;
    if (!activeId && conversations.length > 0) {
      const mostRecent = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveId(mostRecent.id);
    }
  }, [activeId, conversations, scope, isAnon, setActiveId]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const patch = useCallback(
    (id: string, fn: (c: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
    },
    [setConversations],
  );

  const newChat = useCallback(() => {
    // Clean up any existing empty conversation first
    let cleanedId: string | null = null;
    setConversations((prev) => {
      const cleaned = prev.filter((c) => c.messages.length > 0);
      // If there's an active empty conversation, just reuse it
      if (activeId) {
        const active = prev.find((c) => c.id === activeId);
        if (active && active.messages.length === 0) {
          setActiveId(active.id);
          cleanedId = active.id;
          return prev; // don't modify
        }
      }
      const id = uid();
      const conv: Conversation = {
        id,
        title: 'Nouvelle conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setActiveId(id);
      cleanedId = id;
      return [conv, ...cleaned];
    });
    setError(null);
    return cleanedId ?? uid();
  }, [activeId, setConversations, setActiveId]);

  const openConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setError(null);
    },
    [setActiveId],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      const mod = moderate(text);
      if (mod.blocked) {
        setError(MODERATION_REASONS[mod.reason ?? ''] ?? 'Message refusé.');
        return;
      }

      let convId = activeId;
      if (!convId || !conversations.some((c) => c.id === convId)) {
        convId = uid();
        const conv: Conversation = {
          id: convId,
          title: text.slice(0, 60),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setConversations((prev) => [conv, ...prev]);
        setActiveId(convId);
      }

      const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, createdAt: Date.now() };
      const asstMsg: ChatMessage = { id: uid(), role: 'assistant', content: '', createdAt: Date.now() };
      const targetId = convId;

      patch(targetId, (c) => ({
        ...c,
        title: c.messages.length === 0 ? text.slice(0, 60) : c.title,
        messages: [...c.messages, userMsg, asstMsg],
        updatedAt: Date.now(),
      }));

      setError(null);
      setInterrupted(false);
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      // Historique envoyé à l'IA (avant ce tour), sans les placeholders vides
      const previous = active?.messages.filter((m) => m.content.trim()) ?? [];
      const msgs: ApiChatMessage[] = previous.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      msgs.push({ role: 'user', content: text });

      try {
        await chatStream({
          messages: msgs.slice(-8),
          model: settings.model,
          signal: controller.signal,
          onDelta: (d) =>
            patch(targetId, (c) => ({
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === asstMsg.id ? { ...m, content: m.content + d } : m,
              ),
            })),
          onComplete: () => setInterrupted(false),
        });
        patch(targetId, (c) => ({
          ...c,
          updatedAt: Date.now(),
          messages: c.messages.map((m) =>
            m.id === asstMsg.id && !m.content.trim()
              ? { ...m, content: OFFLINE_FALLBACK, offline: true }
              : m,
          ),
        }));
      } catch (err) {
        const aborted = (err as Error)?.name === 'AbortError';
        if (aborted) setInterrupted(true);
        if (!aborted) {
          const status = (err as { status?: number })?.status;
          // Erreur HTTP renvoyee par le serveur : afficher la vraie cause,
          // pas le repli 'hors ligne' qui la masque.
          if (status) {
            setError((err as Error).message);
          } else {
          const offlineAnswer = getOfflineAnswer(text);
          patch(targetId, (c) => ({
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) =>
              m.id === asstMsg.id
                ? { ...m, content: offlineAnswer ?? OFFLINE_FALLBACK, offline: true }
                : m,
            ),
          }));
          }
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [activeId, conversations, active, settings.model, patch, setConversations, setActiveId],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);
    },
    [setConversations, setActiveId, activeId],
  );

  const renameChat = useCallback(
    (id: string, title: string) => {
      patch(id, (c) => ({ ...c, title: title.slice(0, 80) || 'Nouvelle conversation' }));
    },
    [patch],
  );

  const clearAll = useCallback(() => {
    setConversations([]);
    setActiveId(null);
  }, [setConversations, setActiveId]);

  const exportChats = useCallback(() => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nour-historique-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversations]);

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    conversations: sorted,
    active,
    activeId,
    streaming,
    error,
    interrupted,
    setError,
    send,
    stop,
    newChat,
    openConversation,
    deleteChat,
    renameChat,
    clearAll,
    exportChats,
  };
}

export type ChatStore = ReturnType<typeof useChat>;
