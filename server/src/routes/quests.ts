import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware as auth } from './auth.js';
import { checkAchievements, getRank, userPoints } from './achievements.js';
import { config } from '../config.js';
import { getUserApiKey } from './setup.js';

interface QuestTemplate {
  type: string;
  title: string;
  description: string;
  points: number;
}

interface QuestRow {
  quest_id: string;
  title: string;
  description: string;
  type: string;
  points: number;
  done: number;
}

const TEMPLATES: Record<string, QuestTemplate[]> = {
  prayer: [
    { type: 'prayer', title: 'Accomplis une prière surérogatoire (2 rakat)', description: 'Ajoute une sunnah ou une nafila à ta journée.', points: 15 },
    { type: 'prayer', title: 'Prie à l\u2019heure, dès l\u2019adhan', description: 'Efforce-toi de prier la prochaine prière sans retard.', points: 20 },
    { type: 'prayer', title: 'Fais tes invocations après une prière', description: 'Récite les adhkars du matin ou du soir après la prière.', points: 10 },
  ],
  quran: [
    { type: 'quran', title: 'Lis une page du Coran', description: 'Même une page, avec attention et humilité.', points: 15 },
    { type: 'quran', title: 'Mémorise 3 versets', description: 'Choisis une courte sourate et répète-la.', points: 20 },
    { type: 'quran', title: 'Lis la sourate Al-Mulk', description: 'Protection de la tombe : lis Al-Mulk avant de dormir.', points: 15 },
  ],
  dhikr: [
    { type: 'dhikr', title: 'Récite 100 fois \u00ab SubhanAllah \u00bb', description: 'Le dhikr est une lumière pour le cœur.', points: 10 },
    { type: 'dhikr', title: 'Fais 100 fois l\u2019istighfar', description: '\u00ab Astaghfirullah \u00bb — la porte du pardon.', points: 10 },
    { type: 'dhikr', title: 'Récite Ayat al-Kursi', description: 'Après chaque prière et avant de dormir.', points: 15 },
  ],
  charity: [
    { type: 'charity', title: 'Donne une petite sadaqa', description: 'Même un sourire est une aumône.', points: 20 },
    { type: 'charity', title: 'Aide quelqu\u2019un aujourd\u2019hui', description: 'Un service rendu, une écoute, un coup de main.', points: 20 },
    { type: 'charity', title: 'Nourris un affamé ou un animal', description: 'Nourrir un être vivant est une grande récompense.', points: 25 },
  ],
  fasting: [
    { type: 'fasting', title: 'Jeûne un jour (sunnah)', description: 'Lundi ou jeudi, ou les jours blancs (13, 14, 15).', points: 25 },
    { type: 'fasting', title: 'Retarde ton repas pour le jeûne', description: 'Prépare ton intention de jeûner demain.', points: 10 },
  ],
  knowledge: [
    { type: 'knowledge', title: 'Apprends un hadith authentique', description: 'Lis un hadith avec sa référence et partage-le.', points: 15 },
    { type: 'knowledge', title: 'Lis le tafsir d\u2019un verset', description: 'Ouvre l\u2019onglet Coran et lis le tafsir d\u2019un verset.', points: 15 },
    { type: 'knowledge', title: 'Pose une question à Nour', description: 'Apprends quelque chose de nouveau sur ta religion.', points: 10 },
  ],
  akhlaq: [
    { type: 'akhlaq', title: 'Souris sincèrement à quelqu\u2019un', description: '\u00ab Ton sourire à ton frère est une aumône. \u00bb', points: 10 },
    { type: 'akhlaq', title: 'Pardonne à quelqu\u2019un aujourd\u2019hui', description: 'Libère ton cœur d\u2019une rancune.', points: 20 },
    { type: 'akhlaq', title: 'Dis la vérité dans une situation difficile', description: 'L\u2019honnêteté mène à la piété.', points: 20 },
  ],
};


/* ---------- Quiz de verification ----------
   Certaines quetes demandent une petite question avant validation
   (engagement + apprentissage). La bonne reponse reste cote serveur. */
interface Quiz {
  q: string;
  options: string[];
  answer: number;
}

export const QUIZZES: Record<string, Quiz> = {
  dhikr: {
    q: 'Que signifie « SubhanAllah » ?',
    options: ['Gloire à Allah', 'Dieu est grand', 'Louange à Allah'],
    answer: 0,
  },
  fasting: {
    q: 'Quels jours sont conseillés pour le jeûne surérogatoire ?',
    options: ['Lundi, jeudi et les jours blancs (13, 14, 15)', 'Samedi et dimanche', 'Les dix premiers jours du mois'],
    answer: 0,
  },
  knowledge: {
    q: 'Que signifie le mot « hadith » ?',
    options: ['Un récit ou une parole rapportée du Prophète ﷺ', 'Un chapitre du Coran', 'Une prière surérogatoire'],
    answer: 0,
  },
  charity: {
    q: 'Quelle est la plus petite aumône selon le hadith ?',
    options: ['Un sourire', 'Une pièce d’or', 'Un repas partagé'],
    answer: 0,
  },
};

/** Vérification attendue pour un type de quête (null = aucune). */
export function verificationFor(type: string): { kind: string } | null {
  if (type === 'prayer') return { kind: 'prayer' };
  if (type === 'quran') return { kind: 'quran' };
  return null;
}

const DEFAULT_POOL = ['prayer', 'quran', 'akhlaq'];

function daySeed(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor(d.getTime() / 86_400_000);
}

function pickTemplates(goals: string[], dateStr: string): QuestTemplate[] {
  const cats = goals.filter((g) => TEMPLATES[g]);
  const pool = cats.length ? cats : DEFAULT_POOL;
  const seed = daySeed(dateStr);
  const out: QuestTemplate[] = [];
  for (let i = 0; i < 3; i++) {
    const cat = pool[i % pool.length];
    const list = TEMPLATES[cat];
    out.push(list[(seed + i * 7) % list.length]);
  }
  return out;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function aiQuests(userId: number, profile: Record<string, unknown>): Promise<QuestTemplate[] | null> {
  const apiKey = getUserApiKey(userId);
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/nour-islamic-chat',
        'X-OpenRouter-Title': 'Nour - Chat Islamique',
      },
      body: JSON.stringify({
        model: config.openRouterModel,
        messages: [
          {
            role: 'system',
            content:
              'Tu génères des quêtes quotidiennes islamiques personnalisées. Réponds UNIQUEMENT en JSON valide, sans texte autour, au format exact : {"quests":[{"title":"...","description":"...","type":"prayer|quran|dhikr|charity|fasting|knowledge|akhlaq","points":10}]}. Trois quêtes maximum, adaptées au profil, bienveillantes, réalistes, sans obligation contraignante ni jugement. Les types autorisés sont uniquement ceux de la liste.',
          },
          { role: 'user', content: `Profil utilisateur : ${JSON.stringify(profile)}` },
        ],
        temperature: 0.6,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(content) as { quests?: unknown } | null;
    if (!parsed || !Array.isArray(parsed.quests)) return null;
    const quests = (parsed.quests as Array<Partial<QuestTemplate>>)
      .filter((q) => typeof q?.title === 'string' && q.title.trim())
      .slice(0, 3)
      .map((q) => ({
        type: typeof q.type === 'string' && TEMPLATES[q.type] ? q.type : 'akhlaq',
        title: q.title!.trim().slice(0, 120),
        description: typeof q.description === 'string' ? q.description.trim().slice(0, 300) : '',
        points: typeof q.points === 'number' && q.points > 0 ? Math.round(q.points) : 10,
      }));
    return quests.length ? quests : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const questsRouter = Router();

// GET /api/quests
questsRouter.get('/', auth, async (req: any, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : toLocalDate();
  let rows = db.prepare('SELECT quest_id, title, description, type, points, done FROM quests WHERE user_id = ? AND date = ?').all(req.user.id, date) as QuestRow[];

  if (rows.length === 0) {
    const goals: string[] = Array.isArray(req.user.profile?.goals) ? req.user.profile.goals : [];
    let templates = pickTemplates(goals, date);
    const ai = await aiQuests(req.user.id, req.user.profile ?? {});
    if (ai) templates = ai;
    const insert = db.prepare(
      'INSERT INTO quests (user_id, date, quest_id, title, description, type, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const questId = `${t.type}-${i}`;
      insert.run(req.user.id, date, questId, t.title, t.description, t.type, t.points);
    }
    rows = db.prepare('SELECT quest_id, title, description, type, points, done FROM quests WHERE user_id = ? AND date = ?').all(req.user.id, date) as QuestRow[];
  }

  rows = rows.map((r) => ({
    ...r,
    verification: verificationFor(r.type),
    quiz: QUIZZES[r.type] ? { type: r.type, q: QUIZZES[r.type].q, options: QUIZZES[r.type].options } : null,
  }));

  const todayPoints = rows.filter((r) => r.done).reduce((s, r) => s + r.points, 0);
  const prayerPoints = db.prepare('SELECT COUNT(*) as n FROM prayers WHERE user_id = ? AND date = ?').get(req.user.id, date) as { n: number };
  const lifetime = db.prepare('SELECT COALESCE(SUM(points), 0) as n FROM quests WHERE user_id = ? AND done = 1').get(req.user.id) as { n: number };
  const lifetimePrayers = db.prepare('SELECT COUNT(*) as n FROM prayers WHERE user_id = ?').get(req.user.id) as { n: number };

  res.json({
    date,
    quests: rows,
    score: todayPoints + prayerPoints.n * 10,
    lifetime: lifetime.n + lifetimePrayers.n * 10,
    completed: rows.filter((r) => r.done).length,
  });
});

// POST /api/quests/:questId/complete — bascule terminé / non terminé
questsRouter.post('/:questId/complete', auth, (req: any, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : toLocalDate();
  const row = db.prepare('SELECT done, points, type FROM quests WHERE user_id = ? AND date = ? AND quest_id = ?').get(req.user.id, date, req.params.questId) as { done: number; points: number; type: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Quête introuvable.' });
  const next = row.done ? 0 : 1;

  // ---- Systeme de verification avant de valider une quete ----
  if (next === 1 && !row.done) {
    // 1) Quete « priere » : une priere doit etre cochee aujourd'hui
    if (row.type === 'prayer') {
      const n = db.prepare('SELECT COUNT(*) as n FROM prayers WHERE user_id = ? AND date = ?').get(req.user.id, date) as { n: number };
      if (n.n === 0) {
        return res.status(200).json({ ok: false, code: 'prayer_required', quest_id: req.params.questId });
      }
    }
    // 2) Quete avec quiz : la bonne reponse est exigee (cote serveur)
    const quiz = QUIZZES[row.type];
    if (quiz) {
      const answer = (req.body ?? {}).answer;
      if (typeof answer !== 'number' || answer < 0 || answer >= quiz.options.length) {
        return res.status(200).json({ ok: false, code: 'quiz_required', quest_id: req.params.questId });
      }
      if (answer !== quiz.answer) {
        return res.status(200).json({ ok: false, code: 'quiz_wrong', quest_id: req.params.questId, correct: quiz.options[quiz.answer] });
      }
    }
  }
  const before = getRank(userPoints(req.user.id));
  db.prepare('UPDATE quests SET done = ? WHERE user_id = ? AND date = ? AND quest_id = ?').run(next, req.user.id, date, req.params.questId);
  const newBadges = checkAchievements(req.user.id);
  const after = getRank(userPoints(req.user.id));
  const newRank = after.id !== before.id ? after : null;
  res.json({ ok: true, quest_id: req.params.questId, done: next === 1, points: next === 1 ? row.points : 0, newBadges, newRank });
});
