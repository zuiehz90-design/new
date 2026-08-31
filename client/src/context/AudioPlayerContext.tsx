import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { audioUrl, RECITERS } from '../lib/quran';
import { SURAHS } from '../lib/surahs';

export interface AudioState {
  reciter: string;
  chapter: number;
  verse: number;
  totalVerses: number;
  surahName: string;
  surahMode: boolean;
  playing: boolean;
}

interface AudioPlayerCtx {
  state: AudioState | null;
  play: (reciter: string, chapter: number, verse: number, totalVerses: number, surahName: string, surahMode?: boolean) => void;
  stop: () => void;
  toggle: () => void;
  prev: () => void;
  /** Enregistre le handler « une sourate entière a été écoutée » (stable). */
  setOnSurahCompleted: (cb: (chapter: number) => void) => void;
  next: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerCtx | null>(null);

export function useAudioPlayer() {
  return useContext(AudioPlayerContext)!;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<AudioState | null>(null);
  const [state, setState] = useState<AudioState | null>(null);

  const createAudio = useCallback((reciter: string, chapter: number, verse: number) => {
    const audio = new Audio(audioUrl(reciter, chapter, verse));
    audioRef.current = audio;
    return audio;
  }, []);

  const onEndedRef = useRef<(() => void) | undefined>(undefined);
  // Callback déclenché quand une sourate entière a été écoutée (dernier verset
  // terminé, avant l'enchaînement vers la suivante). Utilisé pour valider
  // automatiquement une quête de lecture du Coran.
  const onSurahCompletedRef = useRef<((chapter: number) => void) | undefined>(undefined);

  // Lance une sourate entière depuis son verset 1, en jouant la bismillah
  // d'introduction (sauf Al-Fatiha et At-Tawbah). Utilisée par le bouton
  // « ▶ Sourate » et par l'enchaînement automatique des sourates.
  const startSurah = useCallback((reciter: string, chapter: number) => {
    const meta = SURAHS[chapter - 1];
    if (!meta) {
      // Fin du Coran (après la sourate 114) : arrêt propre.
      stateRef.current = null;
      setState(null);
      return;
    }
    const playFirstVerse = () => {
      const audio = createAudio(reciter, chapter, 1);
      const newState: AudioState = { reciter, chapter, verse: 1, totalVerses: meta.ayahs, surahName: meta.name, surahMode: true, playing: true };
      stateRef.current = newState;
      setState(newState);
      audio.onended = () => onEndedRef.current?.();
      audio.onerror = () => { stateRef.current = null; setState(null); };
      void audio.play();
    };
    if (chapter !== 1 && chapter !== 9) {
      const bismillahAudio = createAudio(reciter, 1, 1);
      const bismillahState: AudioState = { reciter, chapter: 1, verse: 1, totalVerses: 1, surahName: 'Al-Fatiha', surahMode: true, playing: true };
      stateRef.current = bismillahState;
      setState(bismillahState);
      bismillahAudio.onended = playFirstVerse;
      bismillahAudio.onerror = playFirstVerse;
      void bismillahAudio.play();
    } else {
      playFirstVerse();
    }
  }, [createAudio]);

  const advanceVerse = useCallback((reciter: string, chapter: number, currentVerse: number, totalVerses: number, surahName: string) => {
    if (currentVerse < totalVerses) {
      const nextVerse = currentVerse + 1;
      const nextAudio = createAudio(reciter, chapter, nextVerse);
      const next: AudioState = { reciter, chapter, verse: nextVerse, totalVerses, surahName, surahMode: true, playing: true };
      stateRef.current = next;
      setState(next);
      nextAudio.onended = () => onEndedRef.current?.();
      nextAudio.onerror = () => { stateRef.current = null; setState(null); };
      void nextAudio.play();
    } else {
      // Sourate terminée : une sourate entière vient d'être écoutée.
      try { onSurahCompletedRef.current?.(chapter); } catch { /* le consommateur décide */ }
      // On enchaîne automatiquement sur la suivante.
      startSurah(reciter, chapter + 1);
    }
  }, [createAudio, startSurah]);

  // onEnded handler (shared)
  onEndedRef.current = () => {
    const s = stateRef.current;
    if (s && s.surahMode) {
      advanceVerse(s.reciter, s.chapter, s.verse, s.totalVerses, s.surahName);
    } else {
      stateRef.current = s ? { ...s, playing: false } : null;
      setState(prev => prev ? { ...prev, playing: false, surahMode: false } : null);
    }
  };

  const play = useCallback((reciter: string, chapter: number, verse: number, totalVerses: number, surahName: string, surahMode = false) => {
    audioRef.current?.pause();

    const startAudio = (rec: string, ch: number, v: number, tot: number, name: string, sm: boolean) => {
      const audio = createAudio(rec, ch, v);
      const newState: AudioState = { reciter: rec, chapter: ch, verse: v, totalVerses: tot, surahName: name, surahMode: sm, playing: true };
      stateRef.current = newState;
      setState(newState);
      audio.onended = () => onEndedRef.current?.();
      audio.onerror = () => { stateRef.current = null; setState(null); };
      void audio.play();
    };

    // Lecture d'une sourate entière : on part toujours du verset 1
    // (avec la bismillah le cas échéant).
    if (surahMode && verse === 1) {
      startSurah(reciter, chapter);
      return;
    }

    startAudio(reciter, chapter, verse, totalVerses, surahName, surahMode);
  }, [createAudio, startSurah]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    stateRef.current = null;
    setState(null);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state) return;
    if (audio.paused) {
      void audio.play();
      stateRef.current = { ...state, playing: true };
      setState(prev => prev ? { ...prev, playing: true } : null);
    } else {
      audio.pause();
      stateRef.current = { ...state, playing: false };
      setState(prev => prev ? { ...prev, playing: false } : null);
    }
  }, [state]);

  const prev = useCallback(() => {
    if (!state || state.verse <= 1) return;
    audioRef.current?.pause();
    play(state.reciter, state.chapter, state.verse - 1, state.totalVerses, state.surahName, state.surahMode);
  }, [state, play]);

  const next = useCallback(() => {
    if (!state || state.verse >= state.totalVerses) return;
    audioRef.current?.pause();
    play(state.reciter, state.chapter, state.verse + 1, state.totalVerses, state.surahName, state.surahMode);
  }, [state, play]);

  // Enregistrement du handler de fin de sourate (référence stable : aucun
  // re-render des consommateurs lors de l'enregistrement).
  const setOnSurahCompleted = useCallback((cb: (chapter: number) => void) => {
    onSurahCompletedRef.current = cb;
  }, []);
  return (
    <AudioPlayerContext.Provider value={{ state, play, stop, toggle, prev, next, setOnSurahCompleted }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
