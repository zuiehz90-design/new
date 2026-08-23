export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  error?: boolean;
  offline?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Verse {
  chapter: number;
  verse: number;
  text: string;
}

export interface Settings {
  lang: 'fr' | 'en' | 'ar';
  theme: 'dark' | 'light';
  model: string;
  prayerMethod: string;
  reciter: string;
  translation: 'fr' | 'en';
  prayerNotifications: boolean;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface PrayerTimesResult {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  next: { name: string; time: string } | null;
}

export interface SearchResult {
  chapter: number;
  verse: number;
  arabic: string;
  translated: string;
  surahName: string;
  /** Result matches a surah name, not a verse. */
  isSurahMatch?: boolean;
}
