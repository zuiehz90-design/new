import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useChatContext } from '../App';
import { useI18n } from '../i18n';
import { useOffline } from '../hooks/useOffline';
import { useSettings } from '../context/SettingsContext';
import { Markdown, SourcesCard } from '../lib/markdown';
import { MoonIcon, SendIcon, StopIcon } from './icons';
import type { ChatMessage } from '../lib/types';

const SUGGESTIONS = [
  'Quels sont les cinq piliers de l\u2019islam ?',
  'Que dit le Coran sur la patience ?',
  'Comment faire la prière correctement ?',
  'Que signifie la Zakat ?',
];

export function ChatView() {
  const chat = useChatContext();
  const { t } = useI18n();
  const offline = useOffline();
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = chat.active?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content.length]);

  const [listOpen, setListOpen] = useState(false);

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
            className="chip hover:!border-emerald-500/50 hover:!text-emerald-300"
            title={t('chat.newChat')}
          >
            ➕ {t('chat.newChat')}
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(t('chat.confirmDelete'))) {
                chat.deleteChat(chat.activeId!);
              }
            }}
            className="chip hover:!border-red-500/50 hover:!text-red-300"
            title={t('chat.deleteChat')}
          >
            🗑️ {t('chat.deleteChat')}
          </button>
        )}
      </div>

      {/* Conversation list drawer */}
      {listOpen && (
        <div className="mb-3 max-h-60 overflow-y-auto rounded-xl p-2" style={{border:"1px solid var(--border-subtle)",background:"var(--bg-card)"}}>
          {chat.conversations.length === 0 ? (
            <p className="p-2 text-center text-xs text-stone-500">{t('chat.noConversations')}</p>
          ) : (
            <ul className="space-y-1">
              {chat.conversations.map((c) => (
                <li key={c.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { chat.openConversation(c.id); setListOpen(false); }}
                    className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm transition"
                    style={chat.activeId === c.id ? { background: 'rgba(4,120,87,0.12)', color: 'var(--accent-primary)', fontWeight: 600 } : { color: 'var(--text-secondary)' }}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t('chat.confirmDelete'))) {
                        chat.deleteChat(c.id);
                      }
                    }}
                    className="shrink-0 rounded-lg px-2 py-2 text-xs text-stone-500 hover:text-red-400"
                    title={t('chat.deleteChat')}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {offline && (
        <div className="mb-3 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-center text-xs text-gold-300">
          {t('offline.banner')}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {chat.streaming && <TypingIndicator />}
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

      <p className="mt-2 hidden text-center text-[11px] leading-snug text-stone-500 sm:block">{t('chat.disclaimer')}</p>
    </div>
  );
}

function EmptyState() {
  const { t } = useI18n();
  const chat = useChatContext();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center animate-fade-in sm:gap-6">
      <div className="font-quran hidden text-4xl text-gold-400 sm:block">﷽</div>
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{t('chat.empty.title')}</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-stone-400 sm:text-sm">{t('chat.empty.subtitle')}</p>
      </div>
      <div className="hidden max-w-md flex-wrap justify-center gap-2 sm:flex">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => chat.send(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { t } = useI18n();
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end animate-fade-in">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-700 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow">
          {message.content}
        </div>
        <span
          className="mt-0.5 flex items-center gap-1 pr-1 text-[10px] text-emerald-400/80"
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
        <div className="card px-4 py-3">
          {message.content ? (
            <div className="md">
              <Markdown text={message.content} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
          {message.content && <SourcesCard text={message.content} />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 pl-1 text-sm text-stone-500">
      <MoonIcon className="h-4 w-4 shrink-0 text-gold-400" />
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
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
        <button type="submit" disabled={!text.trim()} className="btn-primary h-11 shrink-0 px-5 text-[15px]">
          {t('chat.send')} <SendIcon className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
