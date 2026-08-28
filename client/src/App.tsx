import { createContext, useContext, useEffect, useRef, useState, type ReactElement } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ReadingPositionProvider, useReadingPosition } from './context/ReadingPositionContext';
import { I18nProvider, useI18n } from './i18n';
import { useChat, type ChatStore } from './hooks/useChat';
import { usePrayerNotifications } from './hooks/usePrayerNotifications';
import { useDailyNotifications } from './hooks/useDailyNotifications';
import { useQuestNotifications } from './hooks/useQuestNotifications';
import { DevotionProvider } from './hooks/useDevotion';
import { useKeyboardHeight } from './hooks/useKeyboard';
import { initMobileCache } from './lib/mobileCache';
import { DashboardView } from './components/DashboardView';
import { BadgesView } from './components/BadgesView';
import { ChatView } from './components/ChatView';
import { QuranView } from './components/QuranView';
import { PrayerView } from './components/PrayerView';
import { SettingsModal } from './components/SettingsModal';
import { AiSetupModal } from './components/AiSetupModal';
import { ProfileView } from './components/ProfileView';
import { QuestsView } from './components/QuestsView';
import { ProphetsView } from './components/ProphetsView';
import { NamesView } from './components/NamesView';
import { HijriCalendarView } from './components/HijriCalendarView';
import { GlossaryView } from './components/GlossaryView';
import { DhikrCounterView } from './components/DhikrCounterView';
import { QuizView } from './components/QuizView';
import { MiniPlayer } from './components/MiniPlayer';
import { ProfileAvatar } from './components/ProfileAvatar';
import { NotificationCenter } from './components/NotificationCenter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AiSetupProvider } from './hooks/useAiSetup';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { ToastProvider } from './context/ToastContext';
import { MoonIcon, PlusIcon, HomeIcon, ChatIcon, BookIcon, MosqueIcon, SwordsIcon, UserIcon, ProphetsIcon, NamesIcon, CalendarIcon, BookOpenIcon, BeadsIcon, QuizIcon, TrophyIcon, type IconProps } from './components/icons';

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

  // Page précédente (bouton retour) : on mémorise le chemin avant chaque navigation.
  const prevPathRef = useRef<string | null>(null);
  const [prevPath, setPrevPath] = useState<string | null>(null);
  useEffect(() => {
    setPrevPath(prevPathRef.current);
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

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
  useDailyNotifications();

  const topNav = [
    { to: '/', label: 'Accueil', icon: 'home' },
    { to: '/chat', label: 'Nour IA', icon: 'chat', featured: true },
    { to: '/prayer', label: 'Prières', icon: 'prayer' },
    { to: '/quran', label: 'Coran', icon: 'quran' },
    { to: '/quests', label: 'Quêtes', icon: 'quests' },
  ];
  // Navigation mobile : principaux + bouton Plus
  const primaryNav = [
    { to: '/', label: 'Accueil', icon: 'home' },
    { to: '/chat', label: 'Nour IA', icon: 'chat', featured: true },
    { to: '/quran', label: 'Coran', icon: 'quran' },
    { to: '/prayer', label: 'Prières', icon: 'prayer' },
  ];
  const secondaryNav = [
    { to: '/prophets', label: 'Prophètes', icon: 'prophets' },
    { to: '/names', label: '99 Noms', icon: 'names' },
    { to: '/hijri', label: 'Calendrier', icon: 'calendar' },
    { to: '/glossary', label: 'Lexique', icon: 'glossary' },
    { to: '/dhikr', label: 'Dhikr', icon: 'dhikr' },
    { to: '/quiz', label: 'Quiz', icon: 'quiz' },
    { to: '/badges', label: 'Badges', icon: 'badges' },
    { to: '/profile', label: 'Profil', icon: 'profile' },
  ];
  const moreNav = [
    { to: '/prophets', label: 'Prophètes', icon: 'prophets' },
    { to: '/names', label: '99 Noms', icon: 'names' },
    { to: '/hijri', label: 'Calendrier', icon: 'calendar' },
    { to: '/glossary', label: 'Lexique', icon: 'glossary' },
    { to: '/dhikr', label: 'Dhikr', icon: 'dhikr' },
    { to: '/quiz', label: 'Quiz', icon: 'quiz' },
    { to: '/badges', label: 'Badges', icon: 'badges' },
  ];
  const [moreOpen, setMoreOpen] = useState(false);

  // Nom de chaque page (pour afficher le libellé de la page précédente dans le bouton retour).
  const pathLabels: Record<string, string> = {};
  for (const p of [...topNav, ...primaryNav, ...secondaryNav, ...moreNav]) {
    if (!pathLabels[p.to]) pathLabels[p.to] = p.label;
  }

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

const NAV_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  home: HomeIcon,
  chat: ChatIcon,
  quran: BookIcon,
  prayer: MosqueIcon,
  quests: SwordsIcon,
  prophets: ProphetsIcon,
  names: NamesIcon,
  calendar: CalendarIcon,
  glossary: BookOpenIcon,
  dhikr: BeadsIcon,
  quiz: QuizIcon,
  profile: UserIcon,
  badges: TrophyIcon,
};
function NavIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = NAV_ICONS[name];
  return Icon ? <Icon className={className} style={style} /> : null;
}



  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ paddingBottom: kb, transition: 'padding-bottom 200ms ease' }}>
      {/* ====== TOPBAR STICKY (toutes tailles) ====== */}
      <header className="nav-header sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          {prevPath && (
            <button
              onClick={() => navigate(prevPath)}
              aria-label={`Retour à ${pathLabels[prevPath] ?? 'la page précédente'}`}
              title={`Retour à ${pathLabels[prevPath] ?? 'la page précédente'}`}
              className="flex items-center gap-1 rounded-xl px-1.5 py-1 text-sm transition active:scale-90 hover:bg-white/5"
              style={{ color: 'var(--accent-gold)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <span className="max-w-28 truncate text-xs font-semibold">{pathLabels[prevPath] ?? 'Retour'}</span>
            </button>
          )}
          <MoonIcon className="h-6 w-6 shrink-0" style={{ color: "var(--accent-gold)" }} />
          <span className="font-quran text-lg font-bold" style={{ color: "var(--accent-gold)" }}>Nour</span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {topNav.map((item) => (
            <Link
              key={item.to}
              to={navTo(item.to)}
              className={`nav-item px-3 py-2 ${item.featured ? "nav-item-ai" : ""} ${isActive(item.to) ? "nav-item-active" : ""}`}
              aria-current={isActive(item.to) ? 'page' : undefined}
            >
              <NavIcon name={item.icon} className="h-4 w-4" />
              <span>{item.label}</span>
              {item.featured && <span className="nav-ai-dot" aria-hidden="true" />}
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            aria-label="Toutes les pages"
            title="Toutes les pages"
            className={`nav-item px-3 py-2 ${moreOpen || moreNav.some((item) => isActive(item.to)) ? "nav-item-active" : ""}`}
          >
            <span className="text-lg leading-none font-bold">+</span>
          </button>
        </nav>
        <div className="flex items-center gap-1">
          <NotificationCenter />
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Réglages"
            className="rounded-xl p-2 transition active:scale-90 hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <ProfileAvatar size={34} className="ml-1" />
        </div>
      </header>

      {/* Menu « + » desktop : toutes les pages hors onglets de la topbar */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 hidden bg-black/50 backdrop-blur-sm md:block" onClick={() => setMoreOpen(false)} />
          <div className="fixed left-1/2 top-14 z-50 hidden w-64 -translate-x-1/2 md:block">
            <div className="animate-fade-in">
            <div className="card overflow-hidden p-2" style={{ background: 'var(--bg-surface)' }}>
              <p className="px-3 pb-1 pt-2 text-xs font-bold text-gold-400">Toutes les pages</p>
              {moreNav.map((item) => (
                <Link
                  key={item.to}
                  to={navTo(item.to)}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5 ${isActive(item.to) ? 'text-gold-300' : 'text-stone-300'}`}
                >
                  <NavIcon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ====== CONTENU PRINCIPAL ====== */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/chat" element={<ChatView />} />
              <Route path="/quran" element={<QuranView />} />
              <Route path="/prayer" element={<PrayerView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/quests" element={<QuestsView />} />
              <Route path="/prophets" element={<ProphetsView />} />
              <Route path="/names" element={<NamesView />} />
              <Route path="/hijri" element={<HijriCalendarView />} />
              <Route path="/glossary" element={<GlossaryView />} />
              <Route path="/dhikr" element={<DhikrCounterView />} />
              <Route path="/badges" element={<BadgesView />} />
              <Route path="/quiz" element={<QuizView />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* ====== BANNIÈRE COMPTE ANONYME ====== */}
      {user?.isAnonymous && (
        <div
          className="shrink-0 cursor-pointer transition hover:brightness-110 active:scale-[0.98]"
          onClick={() => navigate('/profile')}
          style={{
            background: 'linear-gradient(135deg, #1F6E5C 0%, #D4AF37 100%)',
            borderTop: '1px solid rgba(212,175,55,0.4)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl shrink-0 animate-pulse">🌟</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white drop-shadow">Créez votre compte gratuit</p>
              <p className="text-[11px] text-white/80 truncate">Conservez vos prières, badges et progressions pour toujours</p>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition"
              style={{ background: 'white', color: '#1F6E5C' }}
            >
              C'est gratuit →
            </span>
          </div>
        </div>
      )}


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
      <nav className="relative z-30 flex items-center justify-around border-t border-emerald-900/30 bg-night-900/95 px-1 py-1 pb-safe backdrop-blur-lg md:hidden shrink-0" style={{ minHeight: '56px' }}>
        {primaryNav.map((item) => (
          <Link
            key={item.to}
            to={navTo(item.to)}
            className={`mobile-nav-item flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition active:scale-90 ${
              item.featured ? 'mobile-nav-ai' : ''
            } ${isActive(item.to) ? 'mobile-nav-active' : 'text-stone-400'}`}
            aria-current={isActive(item.to) ? 'page' : undefined}
          >
            <span className="relative">
              <NavIcon name={item.icon} style={{ width: 22, height: 22 }} />
              {item.featured && <span className="nav-ai-dot nav-ai-dot-mobile" aria-hidden="true" />}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition active:scale-90 ${
            moreOpen || secondaryNav.some((item) => isActive(item.to)) ? 'text-gold-300' : 'text-stone-400'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 22, height: 22 }}>
            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span>Plus</span>
        </button>
      </nav>

      {/* Grille Plus : sections secondaires */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-fade-in">
            <div className="card rounded-t-3xl border-t-2 border-gold-500/40 p-4 pb-safe" style={{ background: 'var(--bg-surface)' }}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-gold-400">Explorer</p>
                <button onClick={() => setMoreOpen(false)} className="chip text-xs">✕</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {secondaryNav.map((item) => (
                  <Link
                    key={item.to}
                    to={navTo(item.to)}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 transition active:scale-90 ${
                      isActive(item.to) ? 'border border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border border-stone-700/50 text-stone-400'
                    }`}
                  >
                    <NavIcon name={item.icon} className="h-7 w-7" />
                    <span className="text-[10px] font-medium text-center">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
  useEffect(() => { initMobileCache().catch(() => {}); }, []);
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
const LOADING_QUOTES = [
  { text: "Inna ma'l-usri yusra", sub: "Certes, avec la difficulte vient la facilité. (94:6)" },
  { text: "Fabi-ayyi ala-i rabbikuma tukazzibani", sub: "Quel bienfait de votre Seigneur donc, hommes, nierez-vous ? (55:13)" },
  { text: "Qul huwa Allahu ahad", sub: "Dis : Il est Allah, l'Un. (112:1)" },
  { text: "Wa huwa ma'akum aina ma kuntum", sub: "Il est avec vous où que vous soyez. (57:4)" },
  { text: "Inna-llaha ala kulli shay'in qadir", sub: "Certes, Allah est Omnipotent. (2:20)" },
  { text: "Rabbana la tuzigh qulubana", sub: "Seigneur, ne laisse pas nos cœurs dévier. (3:8)" },
  { text: "Hasbiyallahu la ilaha illa hu", sub: "Allah me suffit, point de divinité si Lui. (9:129)" },
];

const LOADING_TIPS = [
  "Astuce : Utilisez le mode Coran pour lire sans distraction.",
  "Astuce : Appuyez sur Espace dans le compteur Dhikr.",
  "Astuce : Épinglez vos versets préférés pour les retrouver vite.",
  "Astuce : Le chat IA peut répondre à vos questions sur l'islam.",
  "Astuce : Les 99 noms d'Allah ont une signification profonde.",
  "Astuce : Le Quiz hebdomadaire renforce votre savoir.",
  "Astuce : Le mode concentration masque les notifications.",
];

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
            <DevotionProvider>
              <AudioPlayerProvider>
                <Shell />
              </AudioPlayerProvider>
            </DevotionProvider>
          </ToastProvider>
        </ChatProvider>
        </ReadingPositionProvider>
      </AiSetupProvider>
    </div>
  );
}
