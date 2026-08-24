/**
 * Suggestions contextuelles : proposent des questions adaptées au moment
 * de la journée (aube, matin, midi, après-midi, soir, nuit) + générales.
 */

export type DayPeriod = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

const PERIOD_BY_HOUR: Array<{ from: number; to: number; period: DayPeriod }> = [
  { from: 3, to: 6, period: 'dawn' },
  { from: 6, to: 11, period: 'morning' },
  { from: 11, to: 13, period: 'noon' },
  { from: 13, to: 17, period: 'afternoon' },
  { from: 17, to: 21, period: 'evening' },
  { from: 21, to: 24, period: 'night' },
  { from: 0, to: 3, period: 'night' },
];

export function currentPeriod(date = new Date()): DayPeriod {
  const h = date.getHours();
  return PERIOD_BY_HOUR.find((p) => h >= p.from && h < p.to)?.period ?? 'morning';
}

type SuggestionsSet = Record<DayPeriod, string[]>;

const FR: SuggestionsSet = {
  dawn: [
    'Quelles invocations pour le Fajr ?',
    'Comment bien débuter sa journée en islam ?',
    'Que dit le Coran sur la lumière et l\u2019aube ?',
  ],
  morning: [
    'Quels sont les adhkars du matin ?',
    'Comment rester productif tout en préservant sa foi ?',
    'Que dit le Coran sur le travail et la subsistance ?',
  ],
  noon: [
    'Comment faire la prière de Dhuhr correctement ?',
    'Que faire pendant la pause de midi pour se rapprocher d\u2019Allah ?',
    'Les mérites de la prière de Dhuhr ?',
  ],
  afternoon: [
    'Quels sont les bienfaits de la prière de Asr ?',
    'Comment gérer la fatigue spirituelle en fin de journée ?',
    'Que dit l\u2019islam sur la gestion du stress ?',
  ],
  evening: [
    'Quels sont les adhkars du soir ?',
    'Comment préparer sa soirée avec sérénité ?',
    'Les mérites de la prière de Maghrib ?',
  ],
  night: [
    'Comment se coucher en tant que musulman ?',
    'Quels sont les bienfaits de la prière de Isha ?',
    'Que réciter avant de dormir ?',
  ],
};

const EN: SuggestionsSet = {
  dawn: [
    'What supplications should I say for Fajr?',
    'How to start the day well as a Muslim?',
    'What does the Quran say about light and dawn?',
  ],
  morning: [
    'What are the morning adhkar?',
    'How to stay productive while keeping faith?',
    'What does the Quran say about work and provision?',
  ],
  noon: [
    'How to pray Dhuhr correctly?',
    'What to do during the lunch break to draw closer to Allah?',
    'What are the virtues of the Dhuhr prayer?',
  ],
  afternoon: [
    'What are the benefits of the Asr prayer?',
    'How to deal with spiritual fatigue at the end of the day?',
    'What does Islam say about managing stress?',
  ],
  evening: [
    'What are the evening adhkar?',
    'How to prepare a peaceful evening?',
    'What are the virtues of the Maghrib prayer?',
  ],
  night: [
    'How should a Muslim go to sleep?',
    'What are the benefits of the Isha prayer?',
    'What should I recite before sleeping?',
  ],
};

const AR: SuggestionsSet = {
  dawn: [
    'ما الأذكار المستحبة في صلاة الفجر؟',
    'كيف أبدأ يومي بشكل جيد كمسلم؟',
    'ماذا يقول القرآن عن النور والفجر؟',
  ],
  morning: [
    'ما هي أذكار الصباح؟',
    'كيف أبقى منتجًا مع الحفاظ على إيماني؟',
    'ماذا يقول القرآن عن العمل والرزق؟',
  ],
  noon: [
    'كيف أصلي صلاة الظهر بشكل صحيح؟',
    'ماذا أفعل في استراحة الظهر للتقرب إلى الله؟',
    'ما فضل صلاة الظهر؟',
  ],
  afternoon: [
    'ما فوائد صلاة العصر؟',
    'كيف أتعامل مع التعب الروحي في نهاية اليوم؟',
    'ماذا يقول الإسلام عن إدارة التوتر؟',
  ],
  evening: [
    'ما هي أذكار المساء؟',
    'كيف أحضّر مسائي بكل هدوء؟',
    'ما فضل صلاة المغرب؟',
  ],
  night: [
    'كيف أنام كنوم المسلم؟',
    'ما فوائد صلاة العشاء؟',
    'ماذا أقرأ قبل النوم؟',
  ],
};

const GENERAL_FR = [
  'Quels sont les cinq piliers de l\u2019islam ?',
  'Que dit le Coran sur la patience ?',
  'Comment faire la prière correctement ?',
  'Que signifie la Zakat ?',
];

const GENERAL_EN = [
  'What are the five pillars of Islam?',
  'What does the Quran say about patience?',
  'How do I pray correctly?',
  'What does Zakat mean?',
];

const GENERAL_AR = [
  'ما هي أركان الإسلام الخمسة؟',
  'ماذا يقول القرآن عن الصبر؟',
  'كيف أصلي بشكل صحيح؟',
  'ما معنى الزكاة؟',
];

export interface ContextualSuggestions {
  period: DayPeriod;
  /** Suggestions liées au moment de la journée. */
  periodSuggestions: string[];
  /** Suggestions générales. */
  generalSuggestions: string[];
  all: string[];
}

export function getSuggestions(lang: string, date = new Date()): ContextualSuggestions {
  const period = currentPeriod(date);
  const dict = lang === 'en' ? EN : lang === 'ar' ? AR : FR;
  const general = lang === 'en' ? GENERAL_EN : lang === 'ar' ? GENERAL_AR : GENERAL_FR;
  const periodSuggestions = dict[period];
  return {
    period,
    periodSuggestions,
    generalSuggestions: general,
    all: [...periodSuggestions, ...general],
  };
}
