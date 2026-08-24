import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { storageKey } from '../lib/storageScope';
import type { Quest } from '../lib/api';
import { RankCard } from './RankCard';

const QUEST_ICONS: Record<string, string> = {
  prayer: '🕌',
  quran: '📖',
  dhikr: '📿',
  charity: '🤲',
  fasting: '🌙',
  knowledge: '🎓',
  akhlaq: '💚',
};

/** Liens Coran associés à certaines quêtes */
const QURAN_LINKS: Record<string, { label: string; href: string }[]> = {
  'Mémorise 3 versets': [
    { label: '📖 Al-Fatiha (1)', href: '/quran?surah=1&verse=1' },
    { label: '📖 Al-Ikhlas (112)', href: '/quran?surah=112&verse=1' },
    { label: '📖 An-Nas (114)', href: '/quran?surah=114&verse=1' },
  ],
  'Récite Ayat al-Kursi': [
    { label: '📖 Ayat al-Kursi (2:255)', href: '/quran?surah=2&verse=255' },
  ],
};

const TIER_ICON: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' };

function localDate(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/** Preuve « Coran ouvert aujourd'hui » (scopee par identite). */
function quranVisitedKey(scope: string): string {
  return storageKey(scope, 'quranVisited:' + localDate());
}

export function QuestsView() {
  const { t } = useI18n();
  const { user, scope } = useAuth();
  const { quests, achievements, toggleQuest } = useDevotion();
  const navigate = useNavigate();

  // Modal de verification (quiz ou lecture Coran) + avertissement priere
  const [verify, setVerify] = useState<{ quest: Quest; feedback?: string } | null>(null);
  const [prayerWarn, setPrayerWarn] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const doComplete = async (q: Quest, opts?: { answer?: number }) => {
    setBusyId(q.quest_id);
    const res = await toggleQuest(q.quest_id, opts);
    setBusyId(null);
    if (!res) return;
    if (res.ok === false) {
      if (res.code === 'prayer_required') { setPrayerWarn(q.quest_id); return; }
      if (res.code === 'quiz_wrong') {
        setVerify((v) => (v ? { ...v, feedback: res.correct } : v));
        return;
      }
      if (res.code === 'quiz_required') { setVerify({ quest: q }); return; }
      return;
    }
    setVerify(null);
  };

  const onComplete = async (q: Quest) => {
    if (q.done === 1) return;
    setPrayerWarn(null);
    // Verification Coran : la page doit avoir ete ouverte aujourd'hui
    // (sinon l'utilisateur peut confirmer une lecture sur papier).
    if (q.verification?.kind === 'quran' && !localStorage.getItem(quranVisitedKey(scope))) {
      setVerify({ quest: q });
      return;
    }
    // Verification quiz : la bonne reponse est exigee (validee cote serveur)
    if (q.quiz) {
      setVerify({ quest: q });
      return;
    }
    await doComplete(q);
  };

  const pickQuiz = async (idx: number) => {
    if (!verify) return;
    await doComplete(verify.quest, { answer: idx });
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-8 pt-4 text-center">
        <section className="card border-emerald-700/40 bg-emerald-900/20 p-6">
          <p className="text-sm text-stone-300">{t('dashboard.loginPrompt')}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-4 animate-fade-in">
      <div className="mb-6 text-center">
        <div className="font-quran text-4xl text-gold-400">﷽</div>
        <h1 className="mt-2 text-2xl font-bold">
          ⚔️ {t('dashboard.quests')}
        </h1>
      </div>

      {achievements && <RankCard achievements={achievements} points={quests?.lifetime ?? 0} />}

      {/* Stats rapides */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-gold-400">{quests?.completed ?? 0}</p>
          <p className="text-[10px] text-stone-400">Complétées</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-gold-400">{quests?.quests?.filter(q => !q.done).length ?? 0}</p>
          <p className="text-[10px] text-stone-400">Restantes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-gold-400">{achievements?.badges?.length ?? 0}🏅</p>
          <p className="text-[10px] text-stone-400">Badges</p>
        </div>
      </div>

      {/* Quêtes */}
      <section className="card mb-4 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gold-400">⚔️ {t('dashboard.quests')}</h2>
        {!quests || quests.quests.length === 0 ? (
          <p className="text-xs text-stone-500">{t('common.loading')}</p>
        ) : (
          <ul className="space-y-2">
            {quests.quests.map((q) => (
              <li key={q.quest_id}>
                <button
                  onClick={() => onComplete(q)}
                  disabled={q.done === 1 || busyId === q.quest_id}
                  className={'card-clickable flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ' + (q.done ? 'border-gold-500/50 bg-gold-500/10 opacity-70 cursor-default' : 'border-emerald-900/40')}
                >
                  <span className="text-2xl">{QUEST_ICONS[q.type] ?? '⭐'}</span>
                  <span className="flex-1">
                    <span className={'block text-sm font-semibold ' + (q.done ? 'text-stone-400 line-through' : '')}>{q.title}</span>
                    {q.description && <span className="block text-[11px] text-stone-500">{q.description}</span>}
                    {/* Liens Coran pour les quêtes spécifiques */}
                    {QURAN_LINKS[q.title] && !q.done && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {QURAN_LINKS[q.title].map((link) => (
                          <button
                            key={link.href}
                            onClick={(e) => { e.stopPropagation(); navigate(link.href); }}
                            className="rounded-lg px-2 py-0.5 text-[10px] font-bold transition hover:bg-emerald-500/20"
                            style={{ background: 'rgba(4,120,87,0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(4,120,87,0.3)' }}
                          >
                            {link.label}
                          </button>
                        ))}
                      </span>
                    )}
                    {(q.verification || q.quiz) && !q.done && (
                      <span className="mt-0.5 block text-[10px] font-semibold text-amber-400/90">
                        🔒 {q.verification?.kind === 'prayer' && t('quest.verify.prayerHint')}
                        {q.verification?.kind === 'quran' && t('quest.verify.quranHint')}
                        {q.quiz && t('quest.verify.quizHint')}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-gold-400">+{q.points}</span>
                  <span className="text-lg">{q.done ? '✅' : busyId === q.quest_id ? '⏳' : '○'}</span>
                </button>

                {/* Avertissement : priere non cochee */}
                {prayerWarn === q.quest_id && (
                  <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-300 animate-fade-in">
                    {t('quest.verify.prayer')}{' '}
                    <button onClick={() => navigate('/prayer')} className="ml-1 font-bold text-red-200 underline underline-offset-2">
                      {t('quest.verify.prayerCta')} →
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Badges */}
      {achievements && (
        <section className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gold-400">🏅 Badges</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {achievements.families.map((family) => {
              const earnedTiers = family.tiers.filter((tier) => tier.earned).length;
              const nextTier = family.tiers.find((tier) => !tier.earned);
              return (
                <div
                  key={family.id}
                  className={'rounded-xl border p-2 text-center transition ' + (earnedTiers > 0 ? 'border-gold-500/50 bg-gold-500/10' : 'border-emerald-900/30 opacity-50')}
                  title={family.description}
                >
                  <p className="text-xl">{family.icon}</p>
                  <p className="text-[10px] font-semibold text-gold-300">{family.name}</p>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    {family.tiers.map((tier) => (
                      <span
                        key={tier.level}
                        className={'text-sm leading-none ' + (tier.earned ? '' : 'opacity-30 grayscale')}
                        title={tier.earned ? undefined : family.current + '/' + tier.threshold}
                      >
                        {TIER_ICON[tier.level]}
                      </span>
                    ))}
                  </div>
                  {nextTier ? (
                    <p className="mt-1 text-[9px] text-stone-500">
                      {family.current}/{nextTier.threshold}
                    </p>
                  ) : (
                    <p className="mt-1 text-[9px] font-bold text-gold-400">Max !</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal de verification */}
      {verify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setVerify(null)}>
          <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            {verify.quest.quiz ? (
              <>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gold-400">🧠 {t('quest.verify.quizTitle')}</h3>
                <p className="mt-2 text-sm leading-relaxed">{verify.quest.quiz.q}</p>
                <div className="mt-3 space-y-2">
                  {verify.quest.quiz.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => pickQuiz(i)}
                      disabled={busyId !== null}
                      className="btn-ghost w-full justify-start rounded-xl border px-3 py-2 text-left text-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {verify.feedback && (
                  <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 animate-fade-in">
                    ✅ {t('quest.verify.quizWrong', { answer: verify.feedback })}
                  </p>
                )}
                <button onClick={() => setVerify(null)} className="mt-3 w-full text-center text-xs text-stone-400 underline underline-offset-2">
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                <h3 className="flex items-center gap-2 text-sm font-bold text-gold-400">📖 {t('quest.verify.quranTitle')}</h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-300">{t('quest.verify.quranBody')}</p>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => { navigate('/quran'); setVerify(null); }}
                    className="btn-primary w-full text-sm"
                  >
                    {t('quest.verify.openQuran')} 📖
                  </button>
                  <button onClick={() => doComplete(verify.quest)} disabled={busyId !== null} className="btn-ghost w-full text-sm">
                    {t('quest.verify.paper')}
                  </button>
                  <button onClick={() => setVerify(null)} className="mt-1 w-full text-center text-xs text-stone-400 underline underline-offset-2">
                    {t('common.cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
