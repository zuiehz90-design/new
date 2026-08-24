export const AVATARS = [
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

export const ACCENTS = [
  { id: 'gold', color: 'gold-400', bg: 'gold-500/15', border: 'gold-500/60', swatch: 'bg-gold-400', label: 'Or (défaut)' },
  { id: 'emerald', color: 'emerald-400', bg: 'emerald-500/15', border: 'emerald-500/60', swatch: 'bg-emerald-400', label: 'Émeraude' },
  { id: 'sapphire', color: 'sky-400', bg: 'sky-500/15', border: 'sky-500/60', swatch: 'bg-sky-400', label: 'Saphir' },
  { id: 'amber', color: 'amber-400', bg: 'amber-500/15', border: 'amber-500/60', swatch: 'bg-amber-400', label: 'Ambre' },
] as const;

export const GOALS = [
  { id: 'prayer', icon: '🕌', label: 'profile.goal.prayer' },
  { id: 'quran', icon: '📖', label: 'profile.goal.quran' },
  { id: 'dhikr', icon: '📿', label: 'profile.goal.dhikr' },
  { id: 'charity', icon: '🤲', label: 'profile.goal.charity' },
  { id: 'fasting', icon: '🌙', label: 'profile.goal.fasting' },
  { id: 'knowledge', icon: '🎓', label: 'profile.goal.knowledge' },
  { id: 'akhlaq', icon: '💚', label: 'profile.goal.akhlaq' },
] as const;

export const SURAHS = [
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

export function getAccent(accentId?: string) {
  return ACCENTS.find(a => a.id === accentId) ?? ACCENTS[0];
}

export const acMap: Record<string, { h: string; b: string }> = {
  gold:     { h: '#d4af37', b: 'rgba(212,175,55,0.3)' },
  emerald:  { h: '#34d399', b: 'rgba(52,211,153,0.3)' },
  sapphire: { h: '#38bdf8', b: 'rgba(56,189,248,0.3)' },
  amber:    { h: '#fbbf24', b: 'rgba(251,191,36,0.3)' },
};