import { createContext, useContext, useEffect, useRef, useState, type ReactElement } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ReadingPositionProvider, useReadingPosition } from './context/ReadingPositionContext';
import { I18nProvider, useI18n } from './i18n';
import { useChat, type ChatStore } from './hooks/useChat';
import { usePrayerNotifications } from './hooks/usePrayerNotifications';
import { useQuestNotifications } from './hooks/useQuestNotifications';
import { useKeyboardHeight } from './hooks/useKeyboard';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { QuranView } from './components/QuranView';
import { PrayerView } from './components/PrayerView';
import { SettingsModal } from './components/SettingsModal';
import { AiSetupModal } from './components/AiSetupModal';
import { ProfileView } from './components/ProfileView';
import { QuestsView } from './components/QuestsView';
import { MiniPlayer } from './components/MiniPlayer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AiSetupProvider } from './hooks/useAiSetup';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { ToastProvider } from './context/ToastContext';
import { MoonIcon, PlusIcon, HomeIcon, ChatIcon, BookIcon, MosqueIcon, SwordsIcon, UserIcon, type IconProps } from './components/icons';

/* ---- Scroll position memory ----
   Stored at module level (not in refs) so the values survive React re-renders
   and are never overwritten by phantom scroll events during navigation. */
const _scrollPositions: Record<string, number> = {};
let _currentPath = '/';

/* ---- ChatContext ---- */
const ChatContext = createContext<ChatStore | null>(null);
export function useChatContext() {
  return useContext(ChatContext)!;
}

function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useChat();
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}


/* ---- Shell ---- */
function Shell() {
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const reading = useReadingPosition();
  const kb = useKeyboardHeight();
  // Memoire de scroll par page : le conteneur est partage entre les routes.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const restoringRef = useRef(false);
  _currentPath = location.pathname;

  // Sauvegarde a chaque scroll reel (pas pendant une restauration).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!restoringRef.current) _scrollPositions[_currentPath] = el.scrollTop;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Restauration au retour sur une page. Le Coran parametre
  // (?surah&verse) gere son propre defilement via ReadingPositionContext.
  useEffect(() => {
    if (location.search) return;
    const saved = _scrollPositions[location.pathname];
    if (typeof saved !== 'number' || saved <= 0) return;
    restoringRef.current = true;
    const timer = setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = Math.min(saved, Math.max(0, el.scrollHeight - el.clientHeight));
      restoringRef.current = false;
    }, 50);
    return () => { clearTimeout(timer); restoringRef.current = false; };
  }, [location.pathname, location.search]);

  const navTo = (to: string) => {
    if (to !== '/quran') return to;
    const last = reading.last;
    return last ? `/quran?surah=${last.chapter}&verse=${last.verse}` : '/quran';
  };
  const chat = useChatContext();
  usePrayerNotifications();
  useQuestNotifications();

  const navItems = [
    { to: '/', label: 'Accueil', icon: 'home' },
    { to: '/chat', label: 'Chat', icon: 'chat' },
    { to: '/quran', label: 'Coran', icon: 'quran' },
    { to: '/prayer', label: 'Prières', icon: 'prayer' },
    { to: '/quests', label: 'Quêtes', icon: 'quests' },
    { to: '/profile', label: 'Profil', icon: 'profile' },
  ];

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

const NAV_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  home: HomeIcon,
  chat: ChatIcon,
  quran: BookIcon,
  prayer: MosqueIcon,
  quests: SwordsIcon,
  profile: UserIcon,
};
function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = NAV_ICONS[name];
  return Icon ? <Icon className={className} /> : null;
}



  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ paddingBottom: kb, transition: 'padding-bottom 200ms ease' }}>
      {/* ====== HEADER MOBILE ====== */}
      <header className="nav-header flex items-center justify-between px-3 py-2 lg:hidden shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
          <MoonIcon className="h-6 w-6" style={{ color: "var(--accent-gold)" }} />
          <span className="font-quran text-lg font-bold" style={{ color: "var(--accent-gold)" }}>Nour</span>
        </div>
        <button
          onClick={() => { chat.newChat(); navigate('/chat'); }}
          className="btn-gold shrink-0 text-xs"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Chat
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ====== SIDEBAR DESKTOP ====== */}
        <aside className="nav-sidebar hidden w-72 shrink-0 flex-col p-4 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <MoonIcon className="h-9 w-9" style={{ color: "var(--accent-gold)" }} />
            <div>
              <h1 className="font-quran text-xl font-bold" style={{ color: "var(--accent-gold)" }}>Nour</h1>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Chat islamique</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={navTo(item.to)}
                className={`nav-item ${isActive(item.to) ? "nav-item-active" : ""}`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <button
              onClick={() => setSettingsOpen(true)}
              className="btn-ghost w-full justify-start text-xs"
            >
              ⚙️ Réglages
            </button>
          </div>
        </aside>

        {/* ====== CONTENU PRINCIPAL ====== */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/chat" element={<ChatView />} />
              <Route path="/quran" element={<QuranView />} />
              <Route path="/prayer" element={<PrayerView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/quests" element={<QuestsView />} />
            </Routes>
          </div>
        </main>
      </div>

            {/* ====== BANNIÈRE COMPTE ANONYME ====== */}
      {user?.isAnonymous && (
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: 'var(--accent-gold-dim)', borderBottom: '1px solid rgba(207, 161, 74, 0.25)' }}>
          <span className="text-xl shrink-0">👤</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-gold)' }}>Compte temporaire</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>Vos données seront supprimées après 7 jours. Créez un compte pour tout conserver !</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition"
            style={{ background: 'var(--accent-gold)', color: '#1a1a1a' }}
          >
            Créer un profil
          </button>
        </div>
      )}

{/* ====== BARRE DU BAS (MOBILE) ====== */}
      <nav className="flex items-center justify-around border-t border-emerald-900/30 bg-night-900/90 px-1 py-1.5 pb-safe backdrop-blur lg:hidden shrink-0">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={navTo(item.to)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs transition ${
              isActive(item.to) ? 'text-gold-300' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <NavIcon name={item.icon} className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AiSetupModal />
      <MiniPlayer />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}

function AppInner() {
  const { settings } = useSettings();
  return (
    <I18nProvider lang={settings.lang}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </I18nProvider>
  );
}

/**
 * Sépare strictement le mode invité du mode connecté : les données locales
 * (conversations, positions de lecture, localisation) sont scopées par identité.
 * Le remount via key={scope} garantit qu'aucune donnée d'un autre compte
 * n'apparaît après connexion / déconnexion.
 */
function AuthGate() {
  const { loading, scope } = useAuth();
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-stone-500">{t('common.loading')}</p>
      </div>
    );
  }
  return (
    <div key={scope} className="contents">
      <AiSetupProvider>
        <ReadingPositionProvider>
        <ChatProvider>
          <ToastProvider>
            <AudioPlayerProvider>
              <Shell />
            </AudioPlayerProvider>
          </ToastProvider>
        </ChatProvider>
        </ReadingPositionProvider>
      </AiSetupProvider>
    </div>
  );
}
