import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChatContext } from '../App';
import { useAiSetup } from '../hooks/useAiSetup';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useOffline } from '../hooks/useOffline';
import { useSettings } from '../context/SettingsContext';
import { Markdown, SourcesCard } from '../lib/markdown';
import { getSuggestions, type DayPeriod } from '../lib/suggestions';
import { MoonIcon, SendIcon, StopIcon } from './icons';
import { ThinkingIndicator } from './ThinkingIndicator';
import type { ChatMessage } from '../lib/types';

const PERIOD_EMOJI: Record<DayPeriod, string> = {
  dawn: '🌅',
  morning: '☀️',
  noon: '🌞',
  afternoon: '🌤️',
  evening: '🌇',
  night: '🌙',
};

export function ChatView() {
  const chat = useChatContext();
  const { t } = useI18n();
  const offline = useOffline();
  const navigate = useNavigate();
  const { status: aiStatus, open: openAiSetup } = useAiSetup();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const askHandledRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track if user is near the bottom (auto-scroll only when user is reading the latest)
  const atBottomRef = useRef(true);
  const messages = chat.active?.messages ?? [];

  // Prompt prérempli via /chat?ask=<nom> (bouton « Poser une question » sur les prophètes).
  useEffect(() => {
    const ask = searchParams.get('ask');
    if (!ask || askHandledRef.current) return;
    askHandledRef.current = true;
    setSearchParams({}, { replace: true }); // nettoie l'URL (pas de renvoi au refresh)
    const prompt = t('chat.askAbout', { name: ask });
    // Laisse le temps au store de se monter puis envoie le message.
    setTimeout(() => { chat.send(prompt); }, 250);
  }, [searchParams, setSearchParams, chat.send, t]);

  // Smart auto-scroll: only scroll to bottom if user is already near the bottom.
  // If user scrolled up to read earlier messages, don't force them down.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      atBottomRef.current = dist < 120; // within 120px of bottom = "at bottom"
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Reset scroll position when switching conversations
  useEffect(() => {
    atBottomRef.current = true;
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [chat.active?.id]);

  useEffect(() => {
    if (!atBottomRef.current) return; // user is reading older messages, don't auto-scroll
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content.length]);

  const [listOpen, setListOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === chat.conversations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(chat.conversations.map((c) => c.id)));
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Supprimer ${selected.size} conversation(s) ?`)) return;
    for (const id of selected) chat.deleteChat(id);
    setSelected(new Set());
    setSelectMode(false);
  };

  const deleteAll = () => {
    if (chat.conversations.length === 0) return;
    if (!window.confirm(`Supprimer toutes les conversations (${chat.conversations.length}) ?`)) return;
    chat.clearAll();
    setSelected(new Set());
    setSelectMode(false);
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 pb-4 pt-4">
      {/* Header bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setListOpen(!listOpen)}
            className="chip hover:!border-gold-500/50 hover:!text-gold-300"
            title={t('chat.conversations')}
          >
            💬 {chat.conversations.length}
          </button>
          <button
            onClick={() => { chat.newChat(); setListOpen(false); }}
            className="hidden items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:shadow-[0_0_12px_rgba(212,175,55,0.25)] sm:inline-flex"
            style={{ background: '#112925', borderColor: '#D4AF37', color: '#F4D03F' }}
            title={t('chat.newChat')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" /></svg>
            {t('chat.newChat')}
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(t('chat.confirmDelete'))) {
                chat.deleteChat(chat.activeId!);
              }
            }}
            className="rounded-full border bg-transparent px-3 py-1.5 text-xs font-semibold transition hover:bg-red-900/20"
            style={{ borderColor: '#8B0000', color: '#FF6B6B' }}
            title={t('chat.deleteChat')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline h-3.5 w-3.5"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            {t('chat.deleteChat')}
          </button>
        )}
      </div>

      {/* Conversation list drawer */}
      {listOpen && (
        <div className="mb-3 max-h-60 overflow-y-auto rounded-xl p-2" style={{border:"1px solid var(--border-subtle)",background:"var(--bg-card)"}}>
          {chat.conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-3">
              <p className="text-xs text-stone-500">{t('chat.noConversations')}</p>
              <button
                onClick={() => { chat.newChat(); setListOpen(false); }}
                className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                style={{ background: '#112925', borderColor: '#D4AF37', color: '#F4D03F' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" /></svg>
                {t('chat.newChat')}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => { chat.newChat(); setListOpen(false); }}
                className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition hover:shadow-[0_0_12px_rgba(212,175,55,0.2)] active:scale-95"
                style={{ background: '#112925', border: '1px solid #D4AF37', color: '#F4D03F' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" /></svg>
                Nouvelle conversation
              </button>
              {/* Barre d'actions */}
              <div className="mb-2 flex items-center gap-1 px-1">
                <button
                  onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold transition"
                  style={{ background: selectMode ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.05)', color: selectMode ? '#F4D03F' : 'var(--text-secondary)' }}
                >
                  {selectMode ? '✕ Annuler' : '☑️ Sélectionner'}
                </button>
                {selectMode && (
                  <button
                    onClick={selectAll}
                    className="rounded-lg px-2 py-1 text-[10px] font-bold text-stone-400 transition hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    {selected.size === chat.conversations.length ? ' Tout décocher' : '☑️ Tout cocher'}
                  </button>
                )}
                {selectMode && selected.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="ml-auto rounded-full border bg-transparent px-2.5 py-1 text-[10px] font-bold transition hover:bg-red-900/20"
                    style={{ borderColor: '#8B0000', color: '#FF6B6B' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline h-3 w-3"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Supprimer ({selected.size})
                  </button>
                )}
                {!selectMode && chat.conversations.length > 0 && (
                  <button
                    onClick={deleteAll}
                    className="ml-auto rounded-full border bg-transparent px-2.5 py-1 text-[10px] font-bold transition hover:bg-red-900/20"
                    style={{ borderColor: '#8B0000', color: '#FF6B6B' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline h-3 w-3"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Tout supprimer
                  </button>
                )}
              </div>
              <ul className="space-y-1">
                {chat.conversations.map((c) => (
                  <li key={c.id} className="flex items-center gap-1">
                    {selectMode && (
                      <button
                        onClick={() => toggleSelect(c.id)}
                        className="shrink-0 flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold transition"
                        style={{
                          background: selected.has(c.id) ? '#1F6E5C' : 'rgba(255,255,255,0.08)',
                          border: '1px solid ' + (selected.has(c.id) ? '#D4AF37' : 'rgba(255,255,255,0.15)'),
                          color: selected.has(c.id) ? '#fff' : undefined,
                        }}
                      >
                        {selected.has(c.id) ? '✓' : ''}
                      </button>
                    )}
                    <button
                      onClick={() => { chat.openConversation(c.id); setListOpen(false); }}
                      className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm transition"
                      style={chat.activeId === c.id ? { background: 'rgba(212,175,55,0.12)', color: '#F4D03F', fontWeight: 600 } : { color: 'var(--text-secondary)' }}
                    >
                      {c.title}
                    </button>
                    {!selectMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t('chat.confirmDelete'))) {
                            chat.deleteChat(c.id);
                          }
                        }}
                        className="shrink-0 rounded-lg px-2 py-2 transition hover:bg-red-900/20"
                        style={{ color: '#FF6B6B' }}
                        title={t('chat.deleteChat')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="inline h-3.5 w-3.5"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {offline && (
        <div className="mb-3 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-center text-xs text-gold-300">
          {t('offline.banner')}
        </div>
      )}

      {/* IA non configurée : bannière discrète, pas de popup intrusive */}
      {aiStatus === 'missing' && (
        <div className="mb-3 rounded-xl border border-gold-500/30 bg-stone-900/60 px-4 py-2.5 text-center text-xs text-stone-300">
          {user?.isAnonymous || !user ? (
            <span>
              {t('chat.aiNeedsAccount')}{' '}
              <button className="underline text-gold-300" onClick={() => navigate('/profile')}>
                {t('chat.aiLogin')}
              </button>
            </span>
          ) : (
            <span>
              {t('chat.aiNeedsKey')}{' '}
              <button className="underline text-gold-300" onClick={() => openAiSetup()}>
                {t('chat.aiAddKey')}
              </button>
            </span>
          )}
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} streaming={chat.streaming && m.id === messages[messages.length - 1]?.id} />
            ))}
            {chat.streaming && <ThinkingIndicator />}
            {chat.interrupted && (
              <p className="text-xs text-gold-300">Réponse interrompue — le texte reçu a été conservé.</p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {chat.error && (
        <div className="mb-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {chat.error}
          <button className="ml-3 underline" onClick={() => chat.setError(null)}>
            ✕
          </button>
        </div>
      )}

      <ChatInput
        streaming={chat.streaming}
        onSend={chat.send}
        onStop={chat.stop}
        disabled={false}
      />

      <p className="mt-2 hidden items-center justify-center gap-1 text-center text-xs leading-snug text-[#7A8C87] sm:flex">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          {t('chat.disclaimer')}
        </p>
    </div>
  );
}

function EmptyState() {
  const { t, lang } = useI18n();
  const chat = useChatContext();
  // Suggestions contextuelles : recalculées toutes les minutes (l'heure change)
  const [suggestions, setSuggestions] = useState(() => getSuggestions(lang));
  useEffect(() => {
    setSuggestions(getSuggestions(lang));
    const id = setInterval(() => setSuggestions(getSuggestions(lang)), 60_000);
    return () => clearInterval(id);
  }, [lang]);

  const periodLabel = t(`chat.period.${suggestions.period}`);
  const emoji = PERIOD_EMOJI[suggestions.period];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center animate-fade-in sm:gap-6">
      <div className="font-quran hidden text-4xl text-gold-400 sm:block">﷽</div>
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{t('chat.empty.title')}</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-stone-400 sm:text-sm">{t('chat.empty.subtitle')}</p>
      </div>
      <div className="hidden max-w-md flex-wrap justify-center gap-2 sm:flex">
        <span className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-gold-400">
          {emoji} {periodLabel}
        </span>
        {suggestions.periodSuggestions.map((s) => (
          <button key={s} className="chip" onClick={() => chat.send(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="hidden max-w-md flex-wrap justify-center gap-2 sm:flex">
        {suggestions.generalSuggestions.map((s) => (
          <button key={s} className="chip" onClick={() => chat.send(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const { t } = useI18n();
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end animate-fade-in">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[15px] leading-relaxed text-white shadow"
          style={{ background: '#1F6E5C', borderRadius: '16px 16px 4px 16px' }}>
          {message.content}
        </div>
        <span
          className="mt-0.5 flex items-center gap-1 pr-1 text-[10px] text-[#A3B1AC]"
          title={t('chat.sent')}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t('chat.sent')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[92%]">
        <div className="mb-1 flex items-center gap-2 text-xs text-stone-500">
          <MoonIcon className="h-4 w-4 shrink-0 text-gold-400" />
          <span className="font-semibold text-gold-400">{t('chat.assistant')}</span>
          {message.offline && (
            <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] text-gold-300">
              {t('chat.offline.answer')}
            </span>
          )}
        </div>
        <div className="card px-4 py-3" style={{ borderColor: 'rgba(212,175,55,0.5)' }}>
          {message.content ? (
            <div className="md">
              <Markdown text={message.content} />
            </div>
          ) : streaming ? (
            // Pendant la génération : l'indicateur détaillé est affiché à part.
            null
          ) : (
            <p className="text-sm text-red-300/80">{t('chat.thinking.error')}</p>
          )}
          {message.content && <SourcesCard text={message.content} />}
        </div>
      </div>
    </div>
  );
}

function ChatInput({
  streaming,
  onSend,
  onStop,
}: {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
}) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [text, setText] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (streaming || !text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <form onSubmit={submit} className="mt-3 flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit(e as unknown as FormEvent);
          }
        }}
        rows={1}
        placeholder={t('chat.placeholder')}
        className="input max-h-32 min-h-[44px] flex-1 resize-none text-[15px] sm:text-sm"
        dir={settings.lang === 'ar' ? 'rtl' : 'ltr'}
      />
      {streaming ? (
        <button type="button" onClick={onStop} className="btn-ghost h-11 shrink-0 px-4">
          <StopIcon className="h-4 w-4" /> {t('chat.stop')}
        </button>
      ) : (
        <button type="submit" disabled={!text.trim()} className="h-11 shrink-0 rounded-full px-5 flex items-center gap-2 text-sm font-semibold text-[#1a1a1a] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, #D4AF37, #C49B30)' }}>
          {t('chat.send')} <SendIcon className="h-4 w-4" fill="currentColor" stroke="currentColor" strokeWidth={0} />
        </button>
      )}
    </form>
  );
}
