import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';

const AVATARS = [
  { id: 'initial', icon: '👤', label: 'Initiale' },
  { id: 'mosque', icon: '🕌', label: 'Mosquée' },
  { id: 'kaaba', icon: '🕋', label: 'Kaaba' },
  { id: 'crescent', icon: '☪️', label: 'Croissant' },
  { id: 'moon', icon: '🌙', label: 'Lune' },
  { id: 'star', icon: '⭐', label: 'Étoile' },
  { id: 'lantern', icon: '🏮', label: 'Lanterne' },
  { id: 'book', icon: '📖', label: 'Coran' },
  { id: 'tasbih', icon: '📿', label: 'Tasbih' },
  { id: 'dua', icon: '🤲', label: 'Invocation' },
  { id: 'palm', icon: '🌴', label: 'Palmier' },
  { id: 'heart', icon: '💚', label: 'Cœur' },
] as const;

const ACCENTS = [
  { id: 'gold', color: 'gold-400', bg: 'gold-500/15', border: 'gold-500/60', swatch: 'bg-gold-400', label: 'Or (défaut)' },
  { id: 'emerald', color: 'emerald-400', bg: 'emerald-500/15', border: 'emerald-500/60', swatch: 'bg-emerald-400', label: 'Émeraude' },
  { id: 'sapphire', color: 'sky-400', bg: 'sky-500/15', border: 'sky-500/60', swatch: 'bg-sky-400', label: 'Saphir' },
  { id: 'amber', color: 'amber-400', bg: 'amber-500/15', border: 'amber-500/60', swatch: 'bg-amber-400', label: 'Ambre' },
] as const;

const GOALS = [
  { id: 'prayer', icon: '🕌', label: 'profile.goal.prayer' },
  { id: 'quran', icon: '📖', label: 'profile.goal.quran' },
  { id: 'dhikr', icon: '📿', label: 'profile.goal.dhikr' },
  { id: 'charity', icon: '🤲', label: 'profile.goal.charity' },
  { id: 'fasting', icon: '🌙', label: 'profile.goal.fasting' },
  { id: 'knowledge', icon: '🎓', label: 'profile.goal.knowledge' },
  { id: 'akhlaq', icon: '💚', label: 'profile.goal.akhlaq' },
] as const;

const SURAHS = [
  '', 'Al-Fatiha', 'Al-Baqara', 'Al-Imran', 'An-Nisa', "Al-Ma'ida", "Al-An'am", "Al-A'raf", 'Al-Anfal', 'At-Tawbah',
  'Yunus', 'Hud', 'Yusuf', "Ar-Ra'd", 'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam',
  'Ta-Ha', 'Al-Anbiya', 'Al-Hajj', "Al-Mu'minun", 'An-Nur', 'Al-Furqan', "Ash-Shu'ara", 'An-Naml', 'Al-Qasas', 'Al-Ankabut',
  'Ar-Rum', 'Luqman', 'As-Sajda', 'Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar',
  'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiya', 'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat',
  'Qaf', 'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', "Al-Waqi'a", 'Al-Hadid', 'Al-Mujadila', 'Al-Hashr',
  'Al-Mumtahina', 'As-Saff', "Al-Jumu'a", 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqa',
  "Al-Ma'arij", 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyama', 'Al-Insan', 'Al-Mursalat', 'An-Naba', "An-Nazi'at",
  'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', "Al-A'la", 'Al-Ghashiya', 'Al-Fajr',
  'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyina', 'Az-Zalzala',
  'Al-Adiyat', "Al-Qari'a", 'At-Takathur', 'Al-Asr', 'Al-Humaza', 'Al-Fil', 'Quraysh', "Al-Ma'un", 'Al-Kawthar', 'Al-Kafirun',
  'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

function getAccent(accentId?: string) {
  return ACCENTS.find(a => a.id === accentId) ?? ACCENTS[0];
}


export function ProfileView() {
  const { t } = useI18n();
  const { user, loading, login, register, logout, updateProfile } = useAuth();
  const { prayers, quests } = useDevotion();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
    const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editName, setEditName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState<string>((user?.profile?.avatar as string) ?? 'initial');
  const [accent, setAccent] = useState<string>((user?.profile?.accent as string) ?? 'gold');
  const [favoriteSurah, setFavoriteSurah] = useState<string>((user?.profile?.favoriteSurah as string) ?? '');
  const [gender, setGender] = useState<'male' | 'female' | ''>((user?.profile?.gender as 'male' | 'female') ?? '');
  const [goals, setGoals] = useState<string[]>(user?.profile?.goals ?? []);
  const [note, setNote] = useState<string>((user?.profile?.note as string) ?? '');
  const [saved, setSaved] = useState(false);

  const currentAccent = getAccent(accent);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setAvatar((user.profile?.avatar as string) ?? 'initial');
      setAccent((user.profile?.accent as string) ?? 'gold');
      setFavoriteSurah((user.profile?.favoriteSurah as string) ?? '');
      setGender((user.profile?.gender as 'male' | 'female') ?? '');
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') await login(name, password);
      else await register(name, password);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGoal = (id: string) => {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const saveProfile = async () => {
    setSaved(false);
    try {
      await updateProfile({
        name: editName,
        profile: { avatar, accent, favoriteSurah, gender: gender || undefined, goals, note },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const avatarIcon = avatar === 'initial' ? null : AVATARS.find(a => a.id === avatar)?.icon;

  if (loading) {
    return <p className="p-8 text-center text-sm text-stone-500">{t('common.loading')}</p>;
  }

  if (!user || user.isAnonymous) {
    return (
      <div className="mx-auto max-w-md px-4 pb-10 pt-8 animate-fade-in">
        <div className="mb-6 text-center">
          <div className="font-quran text-4xl text-gold-400">﷽</div>
          <h1 className="mt-2 text-2xl font-bold">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-stone-400">{t('profile.subtitle')}</p>
        </div>
        {user?.isAnonymous && (
          <div className="mb-4 rounded-xl border border-gold-500/40 bg-gold-500/10 p-4">
            <p className="text-sm font-semibold text-gold-300">👻 {t('profile.ghostBadge')} — {user.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-300">{t('profile.ghostNote', { name: user.name })}</p>
          </div>
        )}

        <div className="card p-5">
          <div className="mb-4 flex gap-2">
            <button onClick={() => setMode('register')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>{t('profile.register')}</button>
            <button onClick={() => setMode('login')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-emerald-700 text-white' : 'text-stone-400 hover:text-stone-200'}`}>{t('profile.login')}</button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div><label className="mb-1 block text-xs text-stone-500">{t('profile.name')}</label><input value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" required minLength={2} /></div>
            <div><label className="mb-1 block text-xs text-stone-500">{t('profile.password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input text-sm" required minLength={6} /></div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <button type="submit" disabled={submitting} className="btn-gold w-full text-sm">{submitting ? t('common.loading') : mode === 'login' ? t('profile.login') : t('profile.createAccount')}</button>
          </form>
        </div>
      </div>
    );
  }

  const streak = prayers?.streak ?? { current: 0, best: 0 };
  const acMap = {
    gold:    { h: '#d4af37', b: 'rgba(212,175,55,0.3)' },
    emerald: { h: '#34d399', b: 'rgba(52,211,153,0.3)' },
    sapphire:{ h: '#38bdf8', b: 'rgba(56,189,248,0.3)' },
    amber:   { h: '#fbbf24', b: 'rgba(251,191,36,0.3)' },
  };
  const ac = acMap[currentAccent.id] ?? acMap.gold;

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-8 animate-fade-in">
      <div className="card mb-5 p-5 border-2" style={{ borderColor: ac.h + '99', backgroundColor: ac.b }}>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-3xl" style={{ borderColor: ac.h + '99', backgroundColor: ac.b }}>
            {avatarIcon ?? user.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: ac.h }}>{user.name}</h1>
  
            {favoriteSurah && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-700/40 bg-emerald-900/30 px-2 py-0.5 text-[11px] text-emerald-300">
                📖 {favoriteSurah}
              </p>
            )}
            {note && (
              <p className="mt-2 text-xs text-stone-400 italic line-clamp-2">« {note} »</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-gold-400">🔥 {streak.current}</p>
          <p className="text-[10px] text-stone-400">{t('profile.streak')}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-gold-400">🏆 {streak.best}</p>
          <p className="text-[10px] text-stone-400">{t('profile.bestStreak')}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-bold text-gold-400">⭐ {quests?.lifetime ?? 0}</p>
          <p className="text-[10px] text-stone-400">{t('profile.points')}</p>
        </div>
      </div>

      <button onClick={logout} className="btn-ghost mb-4 w-full border border-red-500/40 text-sm text-red-400 hover:bg-red-500/10">
        {t('profile.logout')}
      </button>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-bold" style={{ color: ac.h }}>{t('profile.edit')}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('profile.name')}</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input text-sm" />
          </div>

          <div>
            <label className="mb-2 block text-xs text-stone-500">{t('profile.avatar')}</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => setAvatar(a.id)} title={a.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl transition ${avatar === a.id ? 'scale-110' : 'border-transparent hover:border-emerald-700/40 bg-stone-800/50'}`}
                  style={avatar === a.id ? { borderColor: ac.h + '99', backgroundColor: ac.b } : {}}
                >
                  {a.id === 'initial' ? editName.trim().charAt(0).toUpperCase() || '?' : a.icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-stone-500">{t('profile.accent')}</label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button key={a.id} onClick={() => setAccent(a.id)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs transition ${accent === a.id ? '' : 'border-transparent text-stone-400 hover:border-emerald-700/40'}`}
                  style={accent === a.id ? { borderColor: acMap[a.id]?.h + '99', backgroundColor: acMap[a.id]?.b, color: acMap[a.id]?.h } : {}}
                >
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: acMap[a.id]?.h }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('profile.favoriteSurah')}</label>
            <select value={favoriteSurah} onChange={(e) => setFavoriteSurah(e.target.value)} className="input text-sm">
              <option value="">— {t('profile.noFavoriteSurah')} —</option>
              {SURAHS.filter(Boolean).map((s, i) => (<option key={i} value={s}>{i + 1}. {s}</option>))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('profile.gender')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm transition ${
                  gender === 'male'
                    ? 'border-gold-500/60 bg-gold-500/15 text-gold-300'
                    : 'border-emerald-900/40 text-stone-400 hover:border-emerald-700'
                }`}
              >
                👨 {t('profile.genderMale')}
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm transition ${
                  gender === 'female'
                    ? 'border-pink-500/60 bg-pink-500/15 text-pink-300'
                    : 'border-emerald-900/40 text-stone-400 hover:border-emerald-700'
                }`}
              >
                👩 {t('profile.genderFemale')}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-stone-500">{t('profile.genderHint')}</p>
          </div>

          <div>
            <label className="mb-2 block text-xs text-stone-500">{t('profile.goals')}</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => toggleGoal(g.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${goals.includes(g.id) ? '' : 'border-emerald-900/40 text-stone-400 hover:border-emerald-700'}`}
                  style={goals.includes(g.id) ? { borderColor: ac.h + '99', backgroundColor: ac.b, color: ac.h } : {}}
                >
                  {g.icon} {t(g.label)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('profile.note')}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input h-24 resize-none text-sm" placeholder={t('profile.notePlaceholder')} />
            <p className="mt-1 text-[10px] text-stone-500">{t('profile.noteHint')}</p>
          </div>

          <button onClick={saveProfile} className="btn-primary w-full text-sm">
            {saved ? t('profile.saved') : t('settings.save')}
          </button>
        </div>
      </div>

    </div>
  );
}
