import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { AVATARS, ACCENTS, GOALS, SURAHS, acMap } from '../lib/profileOptions';

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export function OnboardingCarousel({ onDone, onCancel }: Props) {
  const { t } = useI18n();
  const { register, updateProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('initial');
  const [accent, setAccent] = useState('gold');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [favoriteSurah, setFavoriteSurah] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const ac = acMap[accent] ?? acMap.gold;
  const avatarIcon = avatar === 'initial' ? null : AVATARS.find(a => a.id === avatar)?.icon;
  const totalSteps = 7;

  const titleKeys = [
    'onboarding.accountTitle',
    'onboarding.avatarTitle',
    'onboarding.accentTitle',
    'onboarding.genderTitle',
    'onboarding.surahTitle',
    'onboarding.goalsTitle',
    'onboarding.noteTitle',
  ];
  const subtitleKeys = [
    'onboarding.accountSubtitle',
    'onboarding.avatarSubtitle',
    'onboarding.accentSubtitle',
    'onboarding.genderSubtitle',
    'onboarding.surahSubtitle',
    'onboarding.goalsSubtitle',
    'onboarding.noteSubtitle',
  ];

  const toggleGoal = (id: string) => {
    setGoals(prev => (prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]));
  };

  const next = async () => {
    setError(null);
    if (step === 0) {
      if (name.trim().length < 2) { setError(t('onboarding.errName')); return; }
      if (password.length < 6) { setError(t('onboarding.errPassword')); return; }
      setSubmitting(true);
      try {
        await register(name.trim(), password);
        setStep(step + 1);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }
    // Dernière étape : enregistrer le profil complet
    setSubmitting(true);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        profile: { avatar, accent, favoriteSurah, gender: gender || undefined, goals, note },
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => {
    setError(null);
    if (step === 0) { onCancel(); return; }
    setStep(step - 1);
  };

  const progressPct = useMemo(() => Math.round(((step + 1) / totalSteps) * 100), [step]);

  if (done) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="text-5xl">🌙</div>
        <h2 className="mt-4 text-2xl font-bold text-gold-300">{t('onboarding.doneTitle', { name: name.trim() })}</h2>
        <p className="mt-2 text-sm text-stone-400">{t('onboarding.doneSubtitle')}</p>
        <button onClick={onDone} className="btn-gold mt-6 w-full text-sm">
          {t('onboarding.doneStart')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Barre de progression */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
          <span>{t('onboarding.step', { step: step + 1, total: totalSteps })}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="card p-6">
        {/* Aperçu live du profil */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: ac.h + '66', backgroundColor: ac.b }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-2xl" style={{ borderColor: ac.h, backgroundColor: ac.b }}>
            {avatarIcon ?? (name.trim().charAt(0).toUpperCase() || '؟')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: ac.h }}>{name.trim() || t('profile.name')}</p>
            <p className="text-[11px] text-stone-400">{favoriteSurah || t('profile.noFavoriteSurah')}</p>
          </div>
          {gender && <span className="text-xl">{gender === 'male' ? '👨' : '👩'}</span>}
        </div>

        <h2 className="text-lg font-bold text-gold-300">{t(titleKeys[step])}</h2>
        <p className="mt-1 mb-5 text-xs text-stone-400">{t(subtitleKeys[step])}</p>

        {/* ÉTAPE 0 : compte */}
        {step === 0 && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">{t('profile.name')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input text-sm"
                placeholder="Ex : Youssef"
                minLength={2}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">{t('profile.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input text-sm"
                placeholder="••••••"
                minLength={6}
                onKeyDown={(e) => { if (e.key === 'Enter') void next(); }}
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 1 : avatar */}
        {step === 1 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvatar(a.id)}
                title={a.label}
                className={`flex h-14 w-full items-center justify-center rounded-xl border-2 text-2xl transition ${avatar === a.id ? 'scale-105' : 'border-transparent bg-stone-800/50 hover:border-emerald-700/40'}`}
                style={avatar === a.id ? { borderColor: ac.h, backgroundColor: ac.b } : {}}
              >
                {a.id === 'initial' ? (name.trim().charAt(0).toUpperCase() || '؟') : a.icon}
              </button>
            ))}
          </div>
        )}

        {/* ÉTAPE 2 : accent */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a.id)}
                className={`flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left text-sm transition ${accent === a.id ? '' : 'border-transparent text-stone-400 hover:border-emerald-700/40'}`}
                style={accent === a.id ? { borderColor: acMap[a.id]?.h, backgroundColor: acMap[a.id]?.b, color: acMap[a.id]?.h } : {}}
              >
                <span className="h-6 w-6 shrink-0 rounded-full" style={{ backgroundColor: acMap[a.id]?.h }} />
                <span className="truncate">{a.label}</span>
                {accent === a.id && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* ÉTAPE 3 : genre */}
        {step === 3 && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender('male')}
                className={`rounded-xl border-2 px-3 py-6 text-center transition ${gender === 'male' ? 'border-gold-500/60 bg-gold-500/15 text-gold-300' : 'border-emerald-900/40 text-stone-400 hover:border-emerald-700'}`}
              >
                <span className="block text-3xl">👨</span>
                <span className="mt-2 block text-sm font-semibold">{t('profile.genderMale')}</span>
              </button>
              <button
                onClick={() => setGender('female')}
                className={`rounded-xl border-2 px-3 py-6 text-center transition ${gender === 'female' ? 'border-pink-500/60 bg-pink-500/15 text-pink-300' : 'border-emerald-900/40 text-stone-400 hover:border-emerald-700'}`}
              >
                <span className="block text-3xl">👩</span>
                <span className="mt-2 block text-sm font-semibold">{t('profile.genderFemale')}</span>
              </button>
            </div>
            {gender && (
              <button onClick={() => setGender('')} className="mt-3 w-full text-center text-xs text-stone-500 underline hover:text-stone-300">
                {t('onboarding.back')}
              </button>
            )}
          </div>
        )}

        {/* ÉTAPE 4 : sourate favorite */}
        {step === 4 && (
          <select value={favoriteSurah} onChange={(e) => setFavoriteSurah(e.target.value)} className="input text-sm">
            <option value="">— {t('profile.noFavoriteSurah')} —</option>
            {SURAHS.filter(Boolean).map((s, i) => (
              <option key={i} value={s}>{i + 1}. {s}</option>
            ))}
          </select>
        )}

        {/* ÉTAPE 5 : objectifs */}
        {step === 5 && (
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition ${goals.includes(g.id) ? '' : 'border-transparent bg-stone-800/50 text-stone-400 hover:border-emerald-700/40'}`}
                style={goals.includes(g.id) ? { borderColor: ac.h, backgroundColor: ac.b, color: ac.h } : {}}
              >
                <span className="text-xl">{g.icon}</span>
                <span>{t(g.label)}</span>
                {goals.includes(g.id) && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* ÉTAPE 6 : note + fin */}
        {step === 6 && (
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input h-24 resize-none text-sm"
              placeholder={t('profile.notePlaceholder')}
            />
            <p className="mt-2 text-[10px] text-stone-500">{t('profile.noteHint')}</p>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-red-400" role="alert">{error}</p>}

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-2">
          <button onClick={back} className="btn-ghost border border-stone-700/50 px-4 py-2 text-sm text-stone-400 hover:text-stone-200">
            {step === 0 ? t('common.cancel') : t('onboarding.back')}
          </button>
          <button onClick={next} disabled={submitting} className="btn-gold flex-1 py-2 text-sm">
            {submitting
              ? t('common.loading')
              : step === 0
                ? t('onboarding.create')
                : step === totalSteps - 1
                  ? t('onboarding.finish')
                  : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
