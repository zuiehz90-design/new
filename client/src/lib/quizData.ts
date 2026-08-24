/**
 * Banque de questions pour les tests de connaissances islamiques.
 * Catégories : Coran, Prophètes, Prière, Fiqh, Histoire, 99 Noms.
 * Niveaux : facile, moyen, difficile.
 */

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type QuizCategory = 'quran' | 'prophets' | 'prayer' | 'fiqh' | 'history' | 'names';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  question: string;
  questionAr?: string;
  options: string[];
  correct: number;      // index
  explanation: string;
}

export const QUIZ_CATEGORIES: Record<QuizCategory, { fr: string; en: string; ar: string; icon: string }> = {
  quran: { fr: 'Coran', en: 'Quran', ar: 'القرآن', icon: '📖' },
  prophets: { fr: 'Prophètes', en: 'Prophets', ar: 'الأنبياء', icon: '👤' },
  prayer: { fr: 'Prière', en: 'Prayer', ar: 'الصلاة', icon: '🕌' },
  fiqh: { fr: 'Fiqh', en: 'Jurisprudence', ar: 'الفقه', icon: '⚖️' },
  history: { fr: 'Histoire', en: 'History', ar: 'التاريخ', icon: '📜' },
  names: { fr: '99 Noms', en: '99 Names', ar: 'الأسماء', icon: '✨' },
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // === CORAN ===
  {
    id: 'q1', category: 'quran', difficulty: 'easy',
    question: 'Combien de sourates compte le Coran ?',
    options: ['100', '114', '120', '99'],
    correct: 1,
    explanation: 'Le Coran compte 114 sourates de longueurs variables, de Al-Fatiha (1) à An-Nas (114).',
  },
  {
    id: 'q2', category: 'quran', difficulty: 'easy',
    question: 'Quelle est la première sourate du Coran ?',
    options: ['Al-Baqara', 'Al-Fatiha', 'Al-Ikhlas', 'An-Nas'],
    correct: 1,
    explanation: 'Al-Fatiha (L\'Ouverture) est la première sourate, composée de 7 versets.',
  },
  {
    id: 'q3', category: 'quran', difficulty: 'easy',
    question: 'Quelle sourate est appelée « le cœur du Coran » ?',
    options: ['Ya-Sin', 'Ar-Rahman', 'Al-Kahf', 'Al-Mulk'],
    correct: 0,
    explanation: 'Ya-Sin (36) est souvent appelée « le cœur du Coran » (Qalb al-Qur\'an) par le Prophète ﷺ.',
  },
  {
    id: 'q4', category: 'quran', difficulty: 'medium',
    question: 'Combien de versets contient Ayat al-Kursi ?',
    options: ['1 verset', '3 versets', '5 versets', '10 versets'],
    correct: 0,
    explanation: 'Ayat al-Kursi (le Trône) est un seul verset : Sourate 2, verset 255, le plus long verset sur l\'unicité d\'Allah.',
  },
  {
    id: 'q5', category: 'quran', difficulty: 'medium',
    question: 'Quelle sourate ne contient pas la Basmala ?',
    options: ['Al-Fatiha', 'Al-Baqara', 'At-Tawba', 'An-Nas'],
    correct: 2,
    explanation: 'At-Tawba (9) est la seule sourate qui ne commence pas par la Basmala, car elle traite de la rupture des traités.',
  },
  {
    id: 'q6', category: 'quran', difficulty: 'hard',
    question: 'Dans quelle sourate trouve-t-on l\'histoire de Dhul-Qarnayn ?',
    options: ['Al-Kahf', 'Ya-Sin', 'An-Naml', 'Az-Zumar'],
    correct: 0,
    explanation: 'L\'histoire de Dhul-Qarnayn (le Bicorne) se trouve dans Sourate 18 Al-Kahf, versets 83-98.',
  },
  {
    id: 'q7', category: 'quran', difficulty: 'medium',
    question: 'Quelle est la sourate la plus longue du Coran ?',
    options: ['Al-Imran', 'An-Nisa', 'Al-Baqara', 'Al-Ma\'ida'],
    correct: 2,
    explanation: 'Al-Baqara (2) est la plus longue sourate avec 286 versets.',
  },
  {
    id: 'q8', category: 'quran', difficulty: 'hard',
    question: 'Quel verset est considéré comme le plus grand verset du Coran ?',
    options: ['Al-Fatiha:1', 'Ayat al-Kursi (2:255)', 'Al-Ikhlas:1', 'Al-Baqara:286'],
    correct: 1,
    explanation: 'Ayat al-Kursi (2:255) est décrit par le Prophète ﷺ comme « le plus grand verset du Coran ».',
  },

  // === PROPHÈTES ===
  {
    id: 'p1', category: 'prophets', difficulty: 'easy',
    question: 'Qui est le dernier prophète de l\'Islam ?',
    options: ['Ibrahim (as)', 'Musa (as)', 'Muhammad ﷺ', '\'Isa (as)'],
    correct: 2,
    explanation: 'Muhammad ﷺ est le Sceau des prophètes (Khatam an-Nabiyyin), le dernier messager d\'Allah.',
  },
  {
    id: 'p2', category: 'prophets', difficulty: 'easy',
    question: 'Quel prophète construisit la Ka\'ba avec son fils ?',
    options: ['Nuh (as)', 'Ibrahim (as)', 'Musa (as)', 'Dawud (as)'],
    correct: 1,
    explanation: 'Ibrahim (as) construisit la Ka\'ba avec son fils Isma\'il (as), sur ordre d\'Allah.',
  },
  {
    id: 'p3', category: 'prophets', difficulty: 'easy',
    question: 'Quel prophète fut sauvé de la noyade sur l\'arche ?',
    options: ['Nuh (as)', 'Hud (as)', 'Salih (as)', 'Ibrahim (as)'],
    correct: 0,
    explanation: 'Nuh (as) construisit l\'arche sur ordre d\'Allah et fut sauvé du déluge avec les croyants.',
  },
  {
    id: 'p4', category: 'prophets', difficulty: 'medium',
    question: 'Quel prophète reçut la Thora (Tawrat) ?',
    options: ['Dawud (as)', 'Musa (as)', '\'Isa (as)', 'Sulayman (as)'],
    correct: 1,
    explanation: 'Musa (as) reçut la Thora (Tawrat) sur le mont Sinaï, contenant la loi divine pour son peuple.',
  },
  {
    id: 'p5', category: 'prophets', difficulty: 'medium',
    question: 'Quel prophète est appelé « Khalil Allah » (l\'ami intime d\'Allah) ?',
    options: ['Musa (as)', 'Muhammad ﷺ', 'Ibrahim (as)', 'Nuh (as)'],
    correct: 2,
    explanation: 'Ibrahim (as) est appelé « Khalil Allah » — l\'ami intime d\'Allah — en raison de sa dévotion absolue.',
  },
  {
    id: 'p6', category: 'prophets', difficulty: 'hard',
    question: 'Combien de prophètes sont mentionnés nommément dans le Coran ?',
    options: ['15', '25', '40', '124 000'],
    correct: 1,
    explanation: '25 prophètes sont nommément mentionnés dans le Coran. La tradition rapporte 124 000 prophètes au total.',
  },
  {
    id: 'p7', category: 'prophets', difficulty: 'medium',
    question: 'Quel prophète avait le don de parler aux animaux ?',
    options: ['Dawud (as)', 'Sulayman (as)', 'Musa (as)', 'Yusuf (as)'],
    correct: 1,
    explanation: 'Sulayman (as) avait le don de comprendre le langage des animaux et de commander les djinns.',
  },
  {
    id: 'p8', category: 'prophets', difficulty: 'hard',
    question: 'Quel prophète fut jeté dans le feu sans être brûlé ?',
    options: ['Nuh (as)', 'Ibrahim (as)', 'Yunus (as)', 'Ilyas (as)'],
    correct: 1,
    explanation: 'Ibrahim (as) fut jeté dans un immense bûcher par Nimrod, mais Allah ordonna au feu d\'être « fraîcheur et paix ».',
  },

  // === PRIÈRE ===
  {
    id: 'pr1', category: 'prayer', difficulty: 'easy',
    question: 'Combien de prières quotidiennes obligatoires y a-t-il ?',
    options: ['3', '5', '7', '10'],
    correct: 1,
    explanation: 'Il y a 5 prières obligatoires : Fajr, Dhuhr, Asr, Maghrib et Isha, établies lors du Mi\'raj.',
  },
  {
    id: 'pr2', category: 'prayer', difficulty: 'easy',
    question: 'Vers quelle direction les musulmans prient-ils ?',
    options: ['Jérusalem', 'Médine', 'La Mecque (Ka\'ba)', 'Le ciel'],
    correct: 2,
    explanation: 'La Qibla est la direction de la Ka\'ba à La Mecque, changée de Jérusalem vers La Mecque en l\'an 2 de l\'Hégire.',
  },
  {
    id: 'pr3', category: 'prayer', difficulty: 'easy',
    question: 'Combien de rak\'a contient la prière du Fajr ?',
    options: ['2', '3', '4', '6'],
    correct: 0,
    explanation: 'Fajr = 2 rak\'a obligatoires. Dhuhr=4, Asr=4, Maghrib=3, Isha=4.',
  },
  {
    id: 'pr4', category: 'prayer', difficulty: 'medium',
    question: 'Qu\'est-ce que le Wudu ?',
    options: ['La prière du vendredi', 'Les ablutions mineures', 'Le jeûne surérogatoire', 'Le pèlerinage'],
    correct: 1,
    explanation: 'Le Wudu est l\'ablution mineure (purification) requise avant la prière : mains, visage, avant-bras, tête, pieds.',
  },
  {
    id: 'pr5', category: 'prayer', difficulty: 'medium',
    question: 'Quelle prière est accomplie en groupe le vendredi à midi ?',
    options: ['Fajr', 'Dhuhr (Jumu\'a)', 'Asr', 'Isha'],
    correct: 1,
    explanation: 'La prière du Jumu\'a (vendredi) remplace le Dhuhr en communauté avec un sermon (khutba), obligatoire pour les hommes.',
  },
  {
    id: 'pr6', category: 'prayer', difficulty: 'hard',
    question: 'Combien de conditions (shurut) la prière exige-t-elle avant son accomplissement ?',
    options: ['3', '5', '7', '9'],
    correct: 2,
    explanation: 'Les principales conditions : pureté du corps, des vêtements et du lieu, Awra couverte, Qibla, intention, heure entrée, orientation.',
  },
  {
    id: 'pr7', category: 'prayer', difficulty: 'medium',
    question: 'Qu\'est-ce que le Tasbih de Fatima après chaque prière ?',
    options: ['33× Allahu Akbar', '33 Subhan Allah + 33 Alhamdulillah + 34 Allahu Akbar', '100× Astaghfirullah', '10× Salawat'],
    correct: 1,
    explanation: 'Le Prophète ﷺ enseigna à sa fille Fatima : 33× Subhan Allah, 33× Alhamdulillah, 34× Allahu Akbar.',
  },

  // === FIQH ===
  {
    id: 'f1', category: 'fiqh', difficulty: 'easy',
    question: 'Que signifie « Halal » ?',
    options: ['Interdit', 'Permis', 'Déconseillé', 'Obligatoire'],
    correct: 1,
    explanation: 'Halal = ce qui est permis/licite en Islam (nourriture, actions, transactions).',
  },
  {
    id: 'f2', category: 'fiqh', difficulty: 'easy',
    question: 'Quel est le taux de la Zakat annuelle sur l\'épargne ?',
    options: ['1%', '2,5%', '5%', '10%'],
    correct: 1,
    explanation: 'La Zakat est de 2,5% sur l\'épargne qui atteint le seuil (nisab) et reste un an complet.',
  },
  {
    id: 'f3', category: 'fiqh', difficulty: 'medium',
    question: 'Qu\'est-ce que le Tayammum ?',
    options: ['Le grand lavage', 'L\'ablution sèche à la terre', 'Le jeûne volontaire', 'La prière funéraire'],
    correct: 1,
    explanation: 'Le Tayammum est l\'ablution sèche avec de la terre/poussière, en l\'absence d\'eau ou incapacité d\'en utiliser.',
  },
  {
    id: 'f4', category: 'fiqh', difficulty: 'medium',
    question: 'Combien de madhhabs (écoles juridiques) sunnites majeures existent ?',
    options: ['2', '4', '6', '8'],
    correct: 1,
    explanation: 'Les 4 madhhabs sunnites : Hanafi, Maliki, Shafi\'i, Hanbali, nommés d\'après leurs fondateurs.',
  },
  {
    id: 'f5', category: 'fiqh', difficulty: 'hard',
    question: 'Qu\'est-ce que le Riba ?',
    options: ['La charité volontaire', 'L\'usure/intérêt', 'Le mariage', 'Le divorce'],
    correct: 1,
    explanation: 'Le Riba (usure) est strictement interdit en Islam. Inclut tout intérêt sur prêt ou dépôt bancaire.',
  },
  {
    id: 'f6', category: 'fiqh', difficulty: 'medium',
    question: 'Qu\'est-ce que la Niyya ?',
    options: ['L\'appel à la prière', 'L\'intention sincère', 'Le lavage rituel', 'Le sermon'],
    correct: 1,
    explanation: 'La Niyya est l\'intention sincère du cœur, condition de validité de tout acte cultuel (« les actes ne valent que par les intentions »).',
  },

  // === HISTOIRE ===
  {
    id: 'h1', category: 'history', difficulty: 'easy',
    question: 'En quelle année eut lieu l\'Hégire (migration à Médine) ?',
    options: ['620', '622', '630', '632'],
    correct: 1,
    explanation: 'L\'Hégire (Hijra) eut lieu en 622 CE, point de départ du calendrier hégirien.',
  },
  {
    id: 'h2', category: 'history', difficulty: 'easy',
    question: 'Où le Prophète ﷺ est-il né ?',
    options: ['Médine', 'La Mecque', 'Ta\'if', 'Yathrib'],
    correct: 1,
    explanation: 'Le Prophète Muhammad ﷺ naquit à La Mecque en l\'an de l\'Éléphant (570 CE).',
  },
  {
    id: 'h3', category: 'history', difficulty: 'medium',
    question: 'Quelle bataille est appelée « le Jour du discernement » (Furqan) ?',
    options: ['Uhud', 'Badr', 'Khandaq', 'Hunayn'],
    correct: 1,
    explanation: 'Badr (an 2 AH) est appelée « le Jour du discernement » par le Coran, victoire décisive musulmane.',
  },
  {
    id: 'h4', category: 'history', difficulty: 'medium',
    question: 'Combien de compagnons combattaient-ils à Badr ?',
    options: ['100', '313', '1000', '3000'],
    correct: 1,
    explanation: '~313 compagnons affrontèrent ~1000 Qurayshites à Badr et vainquirent par la volonté d\'Allah.',
  },
  {
    id: 'h5', category: 'history', difficulty: 'hard',
    question: 'Qu\'est-ce que la conquête de La Mecque (Fath Makkah) ?',
    options: ['Une défaite musulmane', 'La prise pacifique de La Mecque en l\'an 8 AH', 'Le traité de Hudaybiya', 'La bataille de Uhud'],
    correct: 1,
    explanation: 'En l\'an 8 AH, le Prophète ﷺ entra pacifiquement à La Mecque avec 10 000 hommes, sans effusion de sang.',
  },
  {
    id: 'h6', category: 'history', difficulty: 'hard',
    question: 'Quel fut le premier calife après le Prophète ﷺ ?',
    options: ['Umar ibn al-Khattab', 'Abu Bakr as-Siddiq', 'Uthman ibn Affan', 'Ali ibn Abi Talib'],
    correct: 1,
    explanation: 'Abu Bakr as-Siddiq (رضي الله عنه) fut le premier calife (632-634), compagnon intime du Prophète ﷺ.',
  },

  // === 99 NOMS ===
  {
    id: 'n1', category: 'names', difficulty: 'easy',
    question: 'Quel nom d\'Allah signifie « Le Tout Miséricordieux » ?',
    options: ['Ar-Rahman', 'Al-Malik', 'Al-Quddus', 'As-Salam'],
    correct: 0,
    explanation: 'Ar-Rahman (الرحمن) = Le Tout Miséricordieux, Sa miséricorde embrasse toute chose.',
  },
  {
    id: 'n2', category: 'names', difficulty: 'easy',
    question: 'Quel nom signifie « Le Roi / Le Souverain » ?',
    options: ['Al-Hakim', 'Al-Malik', 'Al-Jabbar', 'Al-Muhaymin'],
    correct: 1,
    explanation: 'Al-Malik (الملك) = Le Souverain absolu, Celui qui règne sur toute la création.',
  },
  {
    id: 'n3', category: 'names', difficulty: 'medium',
    question: 'Quel nom d\'Allah signifie « Le Savant » ?',
    options: ['Al-Alim', 'Al-Basir', 'As-Sami\'', 'Al-Khabir'],
    correct: 0,
    explanation: 'Al-\'Alim (العليم) = L\'Omniscient, Celui dont la science embrasse tout, visible et invisible.',
  },
  {
    id: 'n4', category: 'names', difficulty: 'medium',
    question: 'Quel nom signifie « Celui qui entend tout » ?',
    options: ['Al-Basir', 'As-Sami\'', 'Al-Wali', 'Al-Hakim'],
    correct: 1,
    explanation: 'As-Sami\' (السميع) = L\'Audient, Celui qui entend toute chose, cri ou murmure.',
  },
  {
    id: 'n5', category: 'names', difficulty: 'hard',
    question: 'Combien de noms d\'Allah sont mentionnés dans le hadith des 99 noms ?',
    options: ['33', '66', '99', '100'],
    correct: 2,
    explanation: 'Le hadith rapporte 99 noms d\'Allah. Celui qui les énumère entrera au Paradis.',
  },
];

export const QUIZ_BADGES: { id: string; threshold: number; label: string; icon: string }[] = [
  { id: 'quiz-1', threshold: 1, label: 'Premier quiz', icon: '🎯' },
  { id: 'quiz-3', threshold: 3, label: 'Apprenti', icon: '📚' },
  { id: 'quiz-7', threshold: 7, label: 'Studieux', icon: '✏️' },
  { id: 'quiz-14', threshold: 14, label: 'Érudit', icon: '🎓' },
  { id: 'quiz-30', threshold: 30, label: 'Savant', icon: '🧠' },
  { id: 'quiz-perfect', threshold: 0, label: 'Sans faute', icon: '💯' },
];

// === Stockage local ===
export interface QuizResult {
  date: string;        // ISO
  category: QuizCategory | 'mixed';
  score: number;
  total: number;
  perfect: boolean;
}

export function saveQuizResult(result: QuizResult): QuizResult[] {
  const results: QuizResult[] = JSON.parse(localStorage.getItem('nour:quiz-results') || '[]');
  results.push(result);
  localStorage.setItem('nour:quiz-results', JSON.stringify(results.slice(-200)));
  return results;
}

export function getQuizResults(): QuizResult[] {
  try { return JSON.parse(localStorage.getItem('nour:quiz-results') || '[]'); }
  catch { return []; }
}

export function getQuizStats(): {
  total: number;
  perfect: number;
  bestStreak: number;
  badges: string[];
  weeklyScore: number;
} {
  const results = getQuizResults();
  const weekAgo = Date.now() - 7 * 86400000;
  const weekly = results.filter((r) => new Date(r.date).getTime() > weekAgo);

  const total = results.length;
  const perfect = results.filter((r) => r.perfect).length;

  // Streak = jours consécutifs avec au moins un quiz
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const has = results.some((r) => new Date(r.date).toDateString() === d.toDateString());
    if (has) streak++;
    else if (i > 0) break;
    else if (!has && i === 0) break;
  }

  // Badges
  const badges: string[] = [];
  for (const b of QUIZ_BADGES) {
    if (b.id === 'quiz-perfect') {
      if (perfect > 0) badges.push(b.id);
    } else if (total >= b.threshold) {
      badges.push(b.id);
    }
  }

  const weeklyScore = weekly.reduce((sum, r) => sum + r.score, 0);

  return { total, perfect, bestStreak: streak, badges, weeklyScore };
}

/** Tire N questions aléatoires d'une catégorie (ou mixte). */
export function pickQuestions(category: QuizCategory | 'mixed', count: number = 5): QuizQuestion[] {
  let pool = category === 'mixed'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter((q) => q.category === category);

  // Mélange Fisher-Yates
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
