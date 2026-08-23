import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { audioUrl, RECITERS } from '../lib/quran';

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

  const advanceVerse = useCallback((reciter: string, chapter: number, currentVerse: number, totalVerses: number, surahName: string) => {
    if (currentVerse < totalVerses) {
      const nextVerse = currentVerse + 1;
      const nextAudio = new Audio(audioUrl(reciter, chapter, nextVerse));
      audioRef.current = nextAudio;
      const next: AudioState = { reciter, chapter, verse: nextVerse, totalVerses, surahName, surahMode: true, playing: true };
      stateRef.current = next;
      setState(next);
      nextAudio.onended = () => onEndedRef.current?.();
      nextAudio.onerror = () => { stateRef.current = null; setState(null); };
      void nextAudio.play();
    } else {
      stateRef.current = stateRef.current ? { ...stateRef.current, playing: false, surahMode: false } : null;
      setState(prev => prev ? { ...prev, playing: false, surahMode: false } : null);
    }
  }, []);

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
      const audio = new Audio(audioUrl(rec, ch, v));
      audioRef.current = audio;
      const newState: AudioState = { reciter: rec, chapter: ch, verse: v, totalVerses: tot, surahName: name, surahMode: sm, playing: true };
      stateRef.current = newState;
      setState(newState);
      audio.onended = () => onEndedRef.current?.();
      audio.onerror = () => { stateRef.current = null; setState(null); };
      void audio.play();
    };

    // Jouer la bismillah avant la première lecture d'une sourate
    if (surahMode && verse === 1 && chapter !== 1 && chapter !== 9) {
      const bismillahAudio = new Audio(audioUrl(reciter, 1, 1));
      audioRef.current = bismillahAudio;
      const bismillahState: AudioState = { reciter, chapter: 1, verse: 1, totalVerses: 1, surahName: 'Al-Fatiha', surahMode: false, playing: true };
      stateRef.current = bismillahState;
      setState(bismillahState);
      bismillahAudio.onended = () => { startAudio(reciter, chapter, verse, totalVerses, surahName, true); };
      bismillahAudio.onerror = () => { startAudio(reciter, chapter, verse, totalVerses, surahName, true); };
      void bismillahAudio.play();
    } else {
      startAudio(reciter, chapter, verse, totalVerses, surahName, surahMode);
    }
  }, []);

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

  return (
    <AudioPlayerContext.Provider value={{ state, play, stop, toggle, prev, next }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}
