import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useDevotion } from '../hooks/useDevotion';
import { storageKey } from '../lib/storageScope';
import type { Quest, WeeklyChallenge } from '../lib/api';
import { SURAHS } from '../lib/surahs';
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

const CHALLENGE_ICONS: Record<string, string> = {
  prayers: '🕌',
  quests: '⚔️',
  quran: '📖',
  dhikr: '📿',
  quiz: '🧠',
  streak: '🔥',
  names: '📍',
};

/** Vendredi de la semaine (lundi + 4) : fin des défis. */
function weekEndLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Détecte automatiquement les liens Coran depuis le titre/description d'une quête. */
const SURAH_NAME_MAP: Record<string, { num: number; verse?: number }> = {
  // Courtes sourates (memorisation frequente)
  'al-fatiha': { num: 1 }, 'fatiha': { num: 1 }, 'la ouverture': { num: 1 },
  'an-nas': { num: 114 }, 'nas': { num: 114 }, 'les hommes': { num: 114 },
  'al-falaq': { num: 113 }, 'falaq': { num: 113 }, "l'aube naissante": { num: 113 },
  'al-ikhlas': { num: 112 }, 'ikhlas': { num: 112 }, 'le monotheisme pur': { num: 112 },
  'al-masad': { num: 111 }, 'masad': { num: 111 }, 'la corde': { num: 111 },
  'al-nasr': { num: 110 }, 'nasr': { num: 110 }, 'le secours': { num: 110 },
  'al-kaferun': { num: 109 }, 'kaferun': { num: 109 }, 'les incroyants': { num: 109 },
  'al-kawthar': { num: 108 }, 'kawthar': { num: 108 }, "l'abondance": { num: 108 },
  'al-maun': { num: 107 }, 'maun': { num: 107 },
  'al-quraysh': { num: 106 }, 'quraysh': { num: 106 },
  'al-fil': { num: 105 }, 'fil': { num: 105 }, "l'elephant": { num: 105 },
  'al-humaza': { num: 104 }, 'humaza': { num: 104 },
  'al-asr': { num: 103 }, 'asr': { num: 103 }, 'le temps': { num: 103 },
  'al-takathur': { num: 102 }, 'takathur': { num: 102 },
  'al-qariah': { num: 101 }, 'qariah': { num: 101 },
  'al-adiyat': { num: 100 }, 'adiyat': { num: 100 },
  'al-zalzalah': { num: 99 }, 'zalzalah': { num: 99 },
  'al-bayyinah': { num: 98 }, 'bayyinah': { num: 98 },
  'al-qadr': { num: 97 }, 'qadr': { num: 97 },
  'al-sharh': { num: 94 }, 'sharh': { num: 94 }, "l'epanouissement": { num: 94 },
  'al-duha': { num: 93 }, 'duha': { num: 93 },
  'al-teen': { num: 95 }, 'teen': { num: 95 },
  'al-inshirah': { num: 94 }, 'inshirah': { num: 94 },
  // Sourates courantes
  'al-kahf': { num: 18 }, 'kahf': { num: 18 }, 'la caverne': { num: 18 },
  'ya-sin': { num: 36 }, 'yasin': { num: 36 }, 'ya sin': { num: 36 },
  'ar-rahman': { num: 55 }, 'rahman': { num: 55 }, 'le tout misericordieux': { num: 55 },
  'al-mulk': { num: 67 }, 'mulk': { num: 67 }, 'la royaute': { num: 67 },
  'al-waqiah': { num: 56 }, 'waqiah': { num: 56 },
  'al-qiyamah': { num: 75 }, 'qiyamah': { num: 75 },
  'al-baqara': { num: 2 }, 'baqara': { num: 2 }, 'la vache': { num: 2 },
  'al-imran': { num: 3 }, 'imran': { num: 3 },
  'al-nisa': { num: 4 }, 'nisa': { num: 4 }, 'les femmes': { num: 4 },
  'al-maidah': { num: 5 }, 'maidah': { num: 5 },
  'al-anam': { num: 6 }, 'anam': { num: 6 },
  'al-araf': { num: 7 }, 'araf': { num: 7 },
  'al-anfal': { num: 8 }, 'anfal': { num: 8 },
  'al-tawbah': { num: 9 }, 'tawbah': { num: 9 },
  'yunus': { num: 10 }, 'hud': { num: 11 }, 'yusuf': { num: 12 },
  'ar-rad': { num: 13 }, 'ibrahim': { num: 14 }, 'al-hijr': { num: 15 },
  'al-nahl': { num: 16 }, 'nahl': { num: 16 }, 'les abeilles': { num: 16 },
  'al-isra': { num: 17 },
  'al-anbiya': { num: 21 }, 'anbiya': { num: 21 }, 'les prophetes': { num: 21 },
  'al-hajj': { num: 22 },
  'al-muminun': { num: 23 }, 'muminun': { num: 23 }, 'les croyants': { num: 23 },
  'al-nur': { num: 24 }, 'nur': { num: 24 }, 'la lumiere': { num: 24 },
  'al-furqan': { num: 25 },
  'ash-shuara': { num: 26 },
  'al-naml': { num: 27 }, 'naml': { num: 27 }, 'les fourmis': { num: 27 },
  'al-qasas': { num: 28 }, 'al-ankabut': { num: 29 }, 'ar-rum': { num: 30 },
  'luqman': { num: 31 }, 'as-sajdah': { num: 32 }, 'al-ahzab': { num: 33 },
  'saba': { num: 34 }, 'fatir': { num: 35 }, 'sad': { num: 38 },
  'az-zumar': { num: 39 }, 'ghafir': { num: 40 }, 'fussilat': { num: 41 },
  'ash-shura': { num: 42 }, 'az-zukhruf': { num: 43 },
  'al-jathiyah': { num: 45 }, 'al-ahqaf': { num: 46 },
  'muhammad': { num: 47 }, 'al-fath': { num: 48 }, 'al-hujurat': { num: 49 },
  'qaf': { num: 50 }, 'adh-dhariyat': { num: 51 }, 'at-tur': { num: 52 },
  'an-najm': { num: 53 }, 'al-qamar': { num: 54 },
  'al-hadid': { num: 57 }, 'al-mujadilah': { num: 58 }, 'al-hashr': { num: 59 },
  'al-mumtahanah': { num: 60 }, 'as-saff': { num: 61 }, 'al-jumuah': { num: 62 },
  'al-munafiqun': { num: 63 }, 'at-taghabun': { num: 64 },
  'at-talaq': { num: 65 }, 'at-tahrim': { num: 66 },
  'al-haqqah': { num: 69 }, 'al-maarij': { num: 70 },
  'nuh': { num: 71 }, 'al-jinn': { num: 72 },
  'al-muzzammil': { num: 73 }, 'al-muddathir': { num: 74 },
  'al-insan': { num: 76 }, 'al-mursalat': { num: 77 },
  'an-naba': { num: 78 }, 'an-naziat': { num: 79 }, 'abasa': { num: 80 },
  'al-takwir': { num: 81 }, 'al-infitar': { num: 82 }, 'al-mutaffifin': { num: 83 },
  'al-inshiqaq': { num: 84 }, 'al-buruj': { num: 85 }, 'at-tariq': { num: 86 },
  'al-ala': { num: 87 }, 'al-ghashiyah': { num: 88 }, 'al-fajr': { num: 89 },
  'al-balad': { num: 90 }, 'ash-shams': { num: 91 }, 'al-layl': { num: 92 },
  'al-alq': { num: 96 },
  // Versets specifiques
  'ayat al-kursi': { num: 2, verse: 255 }, 'ayatalkursi': { num: 2, verse: 255 },
  'le trone': { num: 2, verse: 255 },
};

/** Extraire les liens Coran depuis une quête (titre + description). */
function getQuestLinks(title: string, description: string): { label: string; href: string }[] {
  const text = (title + ' ' + description).toLowerCase();
  const links: { label: string; href: string }[] = [];
  const found = new Set<number>();

  for (const [key, val] of Object.entries(SURAH_NAME_MAP)) {
    if (text.includes(key)) {
      if (found.has(val.num)) continue;
      found.add(val.num);
      const surahMeta = SURAHS[val.num - 1];
      const label = `📖 ${surahMeta.name}${val.verse ? ` (${val.num}:${val.verse})` : ` (${val.num})`}`;
      const href = val.verse
        ? `/quran?surah=${val.num}&verse=${val.verse}`
        : `/quran?surah=${val.num}`;
      links.push({ label, href });
    }
  }

  // Si la quête mentionne « Coran » ou « page » sans sourate spécifique
  if (links.length === 0 && /coran|page|verset|recite|r[ée]cite|lis/.test(text)) {
    links.push({ label: '📖 Ouvrir le Coran', href: '/quran' });
  }

  return links;
}

/** Liens autres que le Coran (dhikr, quiz, profil) */
function getQuestExtraLinks(quest: Quest): { label: string; href: string }[] {
  const text = (quest.title + ' ' + quest.description).toLowerCase();
  const links: { label: string; href: string }[] = [];
  if (/dhikr|tasbih|subhan|istighfar|100 fois|invocation|adkar|adhkar/.test(text)) {
    if (/istighfar|astaghfir|pardon/.test(text)) {
    links.push({ label: '📿 Istighfar', href: '/dhikr?id=istighfar-100' });
  } else {
    links.push({ label: '📿 Compteur Dhikr', href: '/dhikr' });
  }
  }
  if (/quiz|connaissance|hadith|apprends|enseigne/.test(text)) {
    links.push({ label: '🧠 Quiz', href: '/quiz' });
    links.push({ label: '📚 Lexique', href: '/glossary' });
  }
  if (/sourate.*memorise|m[ée]morise.*versets?|apprend|99 noms|nom.*allah/.test(text)) {
    links.push({ label: '📍 99 Noms', href: '/names' });
  }
  if (/prie|prier|sunnah|nafila|adhan|rakat|salat|priere/.test(text)) {
    links.push({ label: '🕌 Mes prières', href: '/prayer' });
  }
  if (/don|sadaqa|charit|aum[oô]ne|nourri|affame/.test(text)) {
    links.push({ label: '👤 Mon profil', href: '/profile' });
  }
  if (/je[uû]ne|jeuner|fasting/.test(text)) {
    links.push({ label: '📅 Calendrier', href: '/hijri' });
  }
  if (/souris|pardonne|verit|honn[eê]t|akhlaq|comportement/.test(text)) {
    links.push({ label: '💬 Demander a Nour', href: '/chat' });
  }
  if (/tafsir|exeg[eè]se/.test(text)) {
    links.push({ label: '📖 Ouvrir le Coran', href: '/quran' });
  }
  return links;
}

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
  const { quests, achievements, challenges, toggleQuest, claimChallenge } = useDevotion();
  const navigate = useNavigate();

  // Modal de verification (quiz ou lecture Coran) + avertissement priere
  const [verify, setVerify] = useState<{ quest: Quest; feedback?: string } | null>(null);
  const [prayerWarn, setPrayerWarn] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const onClaim = async (challenge: WeeklyChallenge) => {
    if (claimingId) return;
    setClaimingId(challenge.challenge_id);
    await claimChallenge(challenge.challenge_id);
    setClaimingId(null);
  };

  const doComplete = async (q: Quest, opts?: { answer?: number }) => {
    setBusyId(q.quest_id);
    const res = await toggleQuest(q.quest_id, opts);
    setBusyId(null);
    if (!res) return;
    if (res.ok === false) {
      if (res.code === 'prayer_required') { setPrayerWarn(q.quest_id); return; }
      if (res.code === 'quiz_wrong') {
        setVerify((v) => (v ? { ...v, feedback: typeof res.correct === 'string' ? res.correct : undefined } : v));
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
        <h1 className="mt-2 text-2xl font-bold">
          ⚔️ {t('dashboard.quests')}
        </h1>
      </div>

      {achievements && <RankCard achievements={achievements} />}

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

      {/* Défis hebdomadaires */}
      {challenges && challenges.challenges.length > 0 && (
        <section className="card mb-4 border-gold-500/30 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gold-400">🏆 {t('challenges.title')}</h2>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {t('challenges.weekOf', { date: weekEndLabel(challenges.week_start) })}
          </p>
          <div className="mt-3 space-y-3">
            {challenges.challenges.map((c) => {
              const pct = c.target > 0 ? Math.min(100, Math.round((c.progress / c.target) * 100)) : 0;
              return (
                <div key={c.challenge_id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <span>{CHALLENGE_ICONS[c.type] ?? '🏆'}</span>
                      <span className={c.claimed ? 'text-gold-300' : c.completed ? 'text-gold-400' : ''}>{c.title}</span>
                    </p>
                    <span className="shrink-0 text-[10px] font-bold text-stone-400">{c.progress}/{c.target}</span>
                  </div>
                  <p className="text-[10px] text-stone-500">{c.description}</p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-emerald-950/60">
                    <div
                      className={'h-full rounded-full transition-all duration-500 ' + (c.claimed ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-gold-400')}
                      style={{ width: pct + '%' }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">+{c.points} pts</span>
                    {c.claimed ? (
                      <span className="text-[10px] font-bold text-emerald-400">✓ {t('challenges.claimed')}</span>
                    ) : c.completed ? (
                      <button
                        onClick={() => onClaim(c)}
                        disabled={claimingId !== null}
                        className="btn-gold px-3 py-1 text-[10px]"
                      >
                        {claimingId === c.challenge_id ? '…' : t('challenges.claim')}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                    {/* Liens de redirection automatiques */}
                    {!q.done && (() => {
                      const quranLinks = getQuestLinks(q.title, q.description ?? '');
                      const extraLinks = getQuestExtraLinks(q);
                      const allLinks = [...quranLinks, ...extraLinks];
                      if (allLinks.length === 0) return null;
                      return (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {allLinks.map((link) => (
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
                      );
                    })()}
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
