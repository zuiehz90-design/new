import { useCallback, useEffect, useRef, useState } from 'react';

export const NARRATION_RATES = [0.75, 1, 1.25, 1.5];

/**
 * Narration vocale des histoires via Web Speech API (speechSynthesis).
 * Voix française douce, vitesse réglable, pause/reprise.
 * Fonctionne sur web (Chrome/Safari), desktop Electron et iOS (Capacitor).
 */
export function useNarration() {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlaying(false);
    setPaused(false);
  }, [supported]);

  const play = useCallback((text: string) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Voix douce : on préfère une voix française féminine si disponible
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.find(
      (v) => /^fr/i.test(v.lang) && /female|Audrey|Amélie|Amelie|Julie|Pauline|Hortense|Margaux|Charlotte|Marie/i.test(v.name)
    ) ?? voices.find((v) => /^fr/i.test(v.lang));
    if (fr) u.voice = fr;
    u.lang = fr?.lang ?? 'fr-FR';
    u.rate = rateRef.current;
    u.pitch = 0.95; // légèrement grave = plus apaisant
    u.volume = 1;
    u.onend = () => { setPlaying(false); setPaused(false); utteranceRef.current = null; };
    u.onerror = () => { setPlaying(false); setPaused(false); utteranceRef.current = null; };
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    window.speechSynthesis.resume();
    setPlaying(true);
    setPaused(false);
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported || !playing) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported, playing]);

  const resume = useCallback(() => {
    if (!supported || !paused) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported, paused]);

  const changeRate = useCallback((r: number) => {
    setRate(r);
    rateRef.current = r;
    // Relance la lecture en cours avec la nouvelle vitesse
    if (playing && utteranceRef.current) {
      play(utteranceRef.current.text);
    }
  }, [playing, play]);

  // Workaround Chrome : les longues lectures se mettent en pause après ~15s.
  // Un tick pause/resume périodique maintient la lecture active.
  useEffect(() => {
    if (!supported || !playing || paused) return;
    const id = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) return;
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [supported, playing, paused]);

  // Coupe la voix en quittant la page
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { supported, playing, paused, rate, rates: NARRATION_RATES, play, pause, resume, stop, changeRate };
}
