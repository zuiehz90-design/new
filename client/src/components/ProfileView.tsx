import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { AVATARS, ACCENTS, GOALS, SURAHS, getAccent, acMap } from '../lib/profileOptions';
import { OnboardingCarousel } from './OnboardingCarousel';

export function ProfileView() {
  const { t } = useI18n();
  const { user, loading, login, logout, updateProfile } = useAuth();
  const { prayers, quests } = useDevotion();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [onboarding, setOnboarding] = useState(false);
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
  const mountedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentAccent = getAccent(accent);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setAvatar((user.profile?.avatar as string) ?? 'initial');
      setAccent((user.profile?.accent as string) ?? 'gold');
      setFavoriteSurah((user.profile?.favoriteSurah as string) ?? '');
      setGender((user.profile?.gender as 'male' | 'female') ?? '');
      setGoals(user.profile?.goals ?? []);
      setNote((user.profile?.note as string) ?? '');
    }
  }, [user]);

  // Auto-save avec debounce 800 ms : déclenché à chaque modification du profil.
  // Ignore le premier rendu pour ne pas sauvegarder au montage initial.
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (!user || user.isAnonymous) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
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
    }, 800);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [editName, avatar, accent, favoriteSurah, gender, goals, note]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login(name, password);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGoal = useCallback((id: string) => {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);

  const avatarIcon = avatar === 'initial' ? null : AVATARS.find(a => a.id === avatar)?.icon;

  if (loading) {
    return <p className="p-8 text-center text-sm text-stone-500">{t('common.loading')}</p>;
  }

  if (!user || user.isAnonymous) {
    // Le carousel d'onboarding reste affiché même après la création du compte
    // (register a déjà connecté l'utilisateur) jusqu'à ce qu'il soit terminé.
    if (onboarding) {
      return (
        <div className="mx-auto max-w-md px-4 pb-10 pt-8 animate-fade-in">
          <div className="mb-6 text-center">
            <div className="font-quran text-4xl text-gold-400">﷽</div>
            <h1 className="mt-2 text-2xl font-bold">{t('profile.title')}</h1>
          </div>
          <OnboardingCarousel onDone={() => setOnboarding(false)} onCancel={() => setOnboarding(false)} />
        </div>
      );
    }

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

          {mode === 'register' ? (
            <div className="text-center">
              <div className="text-4xl">🚀</div>
              <p className="mt-3 text-sm text-stone-300">{t('onboarding.intro')}</p>
              <button onClick={() => setOnboarding(true)} className="btn-gold mt-4 w-full text-sm">
                {t('onboarding.start')}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div><label className="mb-1 block text-xs text-stone-500">{t('profile.name')}</label><input value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" required minLength={2} /></div>
              <div><label className="mb-1 block text-xs text-stone-500">{t('profile.password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input text-sm" required minLength={6} /></div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <button type="submit" disabled={submitting} className="btn-gold w-full text-sm">{submitting ? t('common.loading') : t('profile.login')}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const streak = prayers?.streak ?? { current: 0, best: 0 };
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
        <div className="space-y-4">
          {/* Indicateur auto-save */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: ac.h }}>{t('profile.edit')}</h2>
            <span className={`text-[10px] font-medium transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`} style={{ color: ac.h }}>
              {t('profile.saved')}
            </span>
          </div>

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
        </div>
      </div>
    </div>
  );
}
