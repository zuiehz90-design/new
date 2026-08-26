import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { apiSaveApiKey } from '../lib/api';
import { AVATARS, ACCENTS, GOALS, SURAHS, getAccent, acMap, NOTE_TAGS } from '../lib/profileOptions';
import { OnboardingCarousel } from './OnboardingCarousel';

export function ProfileView() {
  const { t } = useI18n();
  const { user, loading, login, logout, updateProfile } = useAuth();
  const { prayers, quests } = useDevotion();

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [onboarding, setOnboarding] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editName, setEditName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState<string>((user?.profile?.avatar as string) ?? 'initial');
  const [accent, setAccent] = useState<string>((user?.profile?.accent as string) ?? 'gold');
  const [favoriteSurah, setFavoriteSurah] = useState<string>((user?.profile?.favoriteSurah as string) ?? '');
  const [gender, setGender] = useState<'male' | 'female' | ''>((user?.profile?.gender as 'male' | 'female') ?? '');
  const [goals, setGoals] = useState<string[]>(user?.profile?.goals ?? []);
  // Migration depuis l'ancien champ "note" vers "tags"
  const [tags, setTags] = useState<string[]>(
    () => (user?.profile?.tags as string[]) ??
    (typeof user?.profile?.note === 'string' && (user.profile.note as string).trim()
      ? [(user.profile.note as string).trim().substring(0, 20)]
      : [])
  );
  const [tagInput, setTagInput] = useState('');
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
      setTags((user.profile?.tags as string[]) ?? []);
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
          profile: { avatar, accent, favoriteSurah, gender: gender || undefined, goals, tags },
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        /* ignore */
      }
    }, 800);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [editName, avatar, accent, favoriteSurah, gender, goals, tags]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await login(name, password);
      // Clé API optionnelle saisie à la connexion (stockée au compte).
      if (apiKey.trim()) {
        await apiSaveApiKey(apiKey).catch(() => {});
      }
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
            <h1 className="mt-2 text-2xl font-bold">{t('profile.title')}</h1>
          </div>
          <OnboardingCarousel onDone={() => setOnboarding(false)} onCancel={() => setOnboarding(false)} />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md px-4 pb-10 pt-8 animate-fade-in">
        <div className="mb-6 text-center">
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
              <div><label className="mb-1 block text-xs text-[#A3B1AC]">{t('profile.name')}</label><input value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" required minLength={2} /></div>
              <div><label className="mb-1 block text-xs text-stone-500">{t('profile.password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input text-sm" required minLength={6} /></div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">{t("profile.apiKeyOptional")}</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="input text-sm" autoComplete="off" spellCheck={false} placeholder="sk-or-v1-…" />
                <p className="mt-1 text-[10px] text-stone-500">{t("profile.apiKeyHint")}</p>
              </div>
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
      <div className="card mb-5 overflow-hidden p-5" style={{ borderColor: 'rgba(212,175,55,0.5)', background: 'radial-gradient(ellipse 70% 90% at 12% 40%, rgba(212,175,55,0.14), transparent 65%), #112925' }}>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-3xl" style={{ borderColor: 'var(--accent-gold)', backgroundColor: '#0a2f26' }}>
            {avatarIcon ?? (user.name || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-white">{user.name}</h1>

            {favoriteSurah && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-[#1F6E5C] px-2 py-0.5 text-[11px] text-white">
                📖 {favoriteSurah}
              </p>
            )}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map(tag => (
                  <span key={tag} className="rounded-full bg-[#1F6E5C] px-2 py-0.5 text-[10px] text-white">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" style={{ color: 'var(--accent-gold)' }} aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
            {streak.current}
          </p>
          <p className="text-[10px] text-[#A3B1AC]">{t('profile.streak')}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" style={{ color: 'var(--accent-gold)' }} aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 5 7 9v0a5 5 0 0 0 5 5h0a5 5 0 0 0 5-5v0c0-4 1-5 2.5-5a2.5 2.5 0 0 1 0 5H18" /><path d="M12 14v7" /><path d="M9 21h6" /></svg>
            {streak.best}
          </p>
          <p className="text-[10px] text-[#A3B1AC]">{t('profile.bestStreak')}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" style={{ color: 'var(--accent-gold)' }} aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            {quests?.lifetime ?? 0}
          </p>
          <p className="text-[10px] text-[#A3B1AC]">{t('profile.points')}</p>
        </div>
      </div>

      <button onClick={logout} className="mb-4 w-full rounded-xl border border-[#8B0000] px-4 py-2.5 text-sm font-semibold text-[#FF6B6B] transition hover:bg-[#8B0000]/15">
        {t('profile.logout')}
      </button>

      <div className="card p-5">
        <div className="space-y-4">
          {/* Indicateur auto-save */}
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#D4AF37]">{t('profile.edit')}</h2>
            <span className={`text-[10px] font-medium transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'var(--accent-gold)' }}>
              {t('profile.saved')}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">{t('profile.name')}</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input text-sm" />
          </div>

          <div>
            <label className="font-display mb-2 block text-sm font-bold text-[#D4AF37]">{t('profile.avatar')}</label>
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
            <label className="font-display mb-2 block text-sm font-bold text-[#D4AF37]">{t('profile.accent')}</label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button key={a.id} onClick={() => setAccent(a.id)} title={a.label} aria-label={a.label}
                  className={`h-9 w-9 rounded-full transition ${accent === a.id ? 'border-[3px] border-gold-300' : 'border border-stone-600/60 hover:border-stone-400'}`}
                  style={{ backgroundColor: acMap[a.id]?.h }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#A3B1AC]">{t('profile.favoriteSurah')}</label>
            <select value={favoriteSurah} onChange={(e) => setFavoriteSurah(e.target.value)} className="input text-sm">
              <option value="">— {t('profile.noFavoriteSurah')} —</option>
              {SURAHS.filter(Boolean).map((s, i) => (<option key={i} value={s}>{i + 1}. {s}</option>))}
            </select>
          </div>

          <div>
            <label className="font-display mb-2 block text-sm font-bold text-[#D4AF37]">{t('profile.gender')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${
                  gender === 'male'
                    ? 'border-[#D4AF37] bg-[#D4AF37] font-bold text-black'
                    : 'border-[#2A4A43] bg-[#112925] text-[#A3B1AC] hover:border-[#D4AF37]'
                }`}
              >
                {t('profile.genderMale')}
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition ${
                  gender === 'female'
                    ? 'border-[#D4AF37] bg-[#D4AF37] font-bold text-black'
                    : 'border-[#2A4A43] bg-[#112925] text-[#A3B1AC] hover:border-[#D4AF37]'
                }`}
              >
                {t('profile.genderFemale')}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-stone-500">{t('profile.genderHint')}</p>
          </div>

          <div>
            <label className="font-display mb-2 block text-sm font-bold text-[#D4AF37]">{t('profile.goals')}</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => toggleGoal(g.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition ${
                    goals.includes(g.id)
                      ? 'border-[#D4AF37] bg-[#D4AF37] font-bold text-black'
                      : 'border-[#D4AF37]/70 bg-[#112925] text-[#F4D03F] hover:border-[#D4AF37]'
                  }`}
                >
                  {goals.includes(g.id) && <span className="text-[10px] font-bold">✓</span>}
                  {g.icon} {t(g.label)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display mb-2 block text-sm font-bold text-[#D4AF37]">{t('profile.tags')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTags(tags.filter(t => t !== tag))}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-[#1F6E5C] px-2.5 py-1 text-xs text-white transition hover:border-red-500/40 hover:bg-red-500/20"
                  title="Cliquez pour retirer"
                >
                  #{tag}
                  <span className="text-[10px] opacity-60">✕</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    const val = tagInput.trim();
                    if (!tags.includes(val)) setTags([...tags, val]);
                    setTagInput('');
                  }
                }}
                className="input flex-1 text-sm"
                placeholder={t('profile.tagsPlaceholder')}
              />
              <button
                type="button"
                onClick={() => {
                  const val = tagInput.trim();
                  if (val && !tags.includes(val)) { setTags([...tags, val]); setTagInput(''); }
                }}
                disabled={!tagInput.trim()}
                className="btn-ghost rounded-xl border border-stone-700/50 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-[10px] text-stone-500 mr-1">{t('common.suggestions')}:</span>
              {NOTE_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                <button
                  key={tag}
                  onClick={() => setTags([...tags, tag])}
                  className="rounded-full border border-[#D4AF37]/40 bg-transparent px-2 py-0.5 text-[10px] text-[#A3B1AC] transition hover:border-[#D4AF37] hover:text-[#F4D03F]"
                >
                  #{tag}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-stone-500">{t('profile.tagsHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
