/**
 * Listes de dhikr courants avec formules arabes, translittération,
 * traduction et mérite (récompense). Données basées sur les hadiths authentiques.
 */

export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;       // nombre recommandé
  merit: string;       // récompense / mérite
  source: string;      // source (hadith)
  category: 'morning' | 'evening' | 'postprayer' | 'general';
}

export const DHIKR_LIST: DhikrItem[] = [
  {
    id: 'subhan-allah-33',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhan Allah',
    translation: 'Gloire et pureté à Allah',
    count: 33,
    merit: 'Deux paroles légères sur la langue, lourdes sur la Balance et aimées du Tout Miséricordieux.',
    source: 'Bukhari & Muslim',
    category: 'postprayer',
  },
  {
    id: 'alhamdulillah-33',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'Toute louange appartient à Allah',
    count: 33,
    merit: 'Remplit la Balance de bonnes actions.',
    source: 'Muslim',
    category: 'postprayer',
  },
  {
    id: 'allahu-akbar-34',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah est le plus Grand',
    count: 34,
    merit: 'Complète le tasbih post-prière (100 total avec les 33+33).',
    source: 'Muslim',
    category: 'postprayer',
  },
  {
    id: 'tasbih-fatima-100',
    arabic: 'سُبْحَانَ اللَّهِ ×33، الْحَمْدُ لِلَّهِ ×33، اللَّهُ أَكْبَرُ ×34',
    transliteration: 'Tasbih de Fatima',
    translation: '33× Subhan Allah, 33× Alhamdulillah, 34× Allahu Akbar',
    count: 100,
    merit: 'Le Prophète ﷺ l\'enseigna à sa fille Fatima comme meilleur que tout serviteur.',
    source: 'Bukhari & Muslim',
    category: 'postprayer',
  },
  {
    id: 'ayat-kursi',
    arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    transliteration: 'Ayat al-Kursi (Sourate 2:255)',
    translation: 'Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même...',
    count: 1,
    merit: 'Celui qui la dit après chaque prière n\'est empêché d\'entrer au Paradis que par la mort.',
    source: 'An-Nasa\'i (hasan)',
    category: 'postprayer',
  },
  {
    id: 'istighfar-100',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfiru Allah',
    translation: 'Je demande pardon à Allah',
    count: 100,
    merit: 'Le Prophète ﷺ demandait pardon 100 fois par jour. Proche du pardon divin.',
    source: 'Bukhari & Muslim',
    category: 'general',
  },
  {
    id: 'salawat-100',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allahumma salli \'ala Muhammad',
    translation: 'Ô Allah, prie sur Muhammad',
    count: 100,
    merit: 'Celui qui prie sur moi une fois, Allah prie sur lui 10 fois.',
    source: 'Muslim',
    category: 'general',
  },
  {
    id: 'tasbih-100',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhan Allahi wa bihamdihi',
    translation: 'Gloire à Allah et par Sa louange',
    count: 100,
    merit: 'Ses péchés sont pardonnés fussent-ils comme l\'écume de la mer.',
    source: 'Bukhari & Muslim',
    category: 'general',
  },
  {
    id: 'tahlil-100',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illa Allah',
    translation: 'Il n\'y a de divinité qu\'Allah',
    count: 100,
    merit: 'Renouvelle la foi, la meilleure des actions, poids lourd sur la Balance.',
    source: 'Bukhari',
    category: 'general',
  },
  {
    id: 'tawhid-10',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illa Allah wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa \'ala kulli shay\'in qadir',
    translation: 'Il n\'y a de divinité qu\'Allah, Unique sans associé. À Lui la royauté, à Lui la louange, et Il est Omnipotent.',
    count: 10,
    merit: 'Équivalent à l\'affranchissement de 4 âmes de la descendance d\'Ismail.',
    source: 'Bukhari & Muslim',
    category: 'postprayer',
  },
  {
    id: 'morning-tasbih',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    transliteration: 'Asbahna wa asbahal-mulku lillah',
    translation: 'Nous voici au matin et le règne appartient à Allah le Seigneur des mondes.',
    count: 1,
    merit: 'Dhikr du matin recommandé.',
    source: 'Muslim',
    category: 'morning',
  },
  {
    id: 'evening-tasbih',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    transliteration: 'Amsayna wa amsal-mulku lillah',
    translation: 'Nous voici au soir et le règne appartient à Allah le Seigneur des mondes.',
    count: 1,
    merit: 'Dhikr du soir recommandé.',
    source: 'Muslim',
    category: 'evening',
  },
  {
    id: 'bismillah-morning',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahilladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'i wa huwas-Sami\'ul-\'Alim',
    translation: 'Au nom d\'Allah par le nom duquel rien ne nuit ni sur terre ni au ciel, et Il est l\'Audient l\'Omniscient.',
    count: 3,
    merit: 'Rien ne lui nuira (3× matin et soir).',
    source: 'Abu Dawud, Tirmidhi',
    category: 'morning',
  },
  {
    id: 'radhitu-billah',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ ﷺ نَبِيًّا',
    transliteration: 'Radhitu billahi Rabba, wa bil-islami dina, wa bi-Muhammadin sallallahu \'alayhi wa sallam nabiyya',
    translation: 'J\'agrée Allah comme Seigneur, l\'Islam comme religion, et Muhammad ﷺ comme prophète.',
    count: 3,
    merit: 'Allah lui garantit de Le satisfaire le Jour Dernier (3× matin et soir).',
    source: 'Ahmad, Tirmidhi',
    category: 'morning',
  },
  {
    id: 'takbir-dhulhijja',
    arabic: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Takbir de Dhoul-Hijja',
    translation: 'Allah est le plus Grand, Allah est le plus Grand, il n\'y a de divinité qu\'Allah, et à Allah la louange',
    count: 33,
    merit: 'À multiplier abondamment pendant les 10 jours de Dhoul-Hijja et les jours de Tashriq.',
    source: 'Bukhari & Muslim',
    category: 'general',
  },
  {
    id: 'last-three-surahs',
    arabic: 'سُورَةُ الْإِخْلَاصِ، الْفَلَقِ، النَّاسِ',
    transliteration: 'Al-Ikhlas, Al-Falaq, An-Nas',
    translation: 'Sourates 112, 113, 114',
    count: 3,
    merit: 'À dire matin et soir, rien ne lui nuira.',
    source: 'Abu Dawud, Tirmidhi',
    category: 'morning',
  },
];

export const DHIKR_CATEGORIES: Record<DhikrItem['category'], { fr: string; en: string; ar: string; icon: string }> = {
  morning: { fr: 'Matin', en: 'Morning', ar: 'الصباح', icon: '🌅' },
  evening: { fr: 'Soir', en: 'Evening', ar: 'المساء', icon: '🌇' },
  postprayer: { fr: 'Après prière', en: 'After prayer', ar: 'بعد الصلاة', icon: '🕌' },
  general: { fr: 'Général', en: 'General', ar: 'عام', icon: '🤲' },
};

/** Sauvegarde et chargement des sessions de dhikr. */
export interface DhikrSession {
  id: string;
  dhikrId: string;
  count: number;
  target: number;
  date: string;       // ISO
  completed: boolean;
}

export function saveDhikrSession(session: DhikrSession) {
  try {
    const sessions: DhikrSession[] = JSON.parse(localStorage.getItem('nour:dhikr-sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('nour:dhikr-sessions', JSON.stringify(sessions.slice(-500)));
  } catch { /* ignore */ }
}

export function getDhikrStats(): { today: number; total: number; sessions: DhikrSession[] } {
  try {
    const sessions: DhikrSession[] = JSON.parse(localStorage.getItem('nour:dhikr-sessions') || '[]');
    const todayStr = new Date().toDateString();
    const today = sessions.filter((s) => new Date(s.date).toDateString() === todayStr).reduce((sum, s) => sum + s.count, 0);
    const total = sessions.reduce((sum, s) => sum + s.count, 0);
    return { today, total, sessions };
  } catch {
    return { today: 0, total: 0, sessions: [] };
  }
}
