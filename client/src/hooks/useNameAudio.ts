import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lecture audio de la prononciation d'un nom.
 *
 * - `play(url)` : lance la lecture, coupe le nom précédent.
 * - `toggleLoop()` : active/désactive la répétition en boucle (utile pour
 *   mémoriser la prononciation d'un nom).
 * - `playing` / `looping` : état exposé à l'interface.
 *
 * Un seul objet Audio est partagé : changer de nom coupe la lecture en cours.
 * On précharge discrètement l'URL suivante pour un enchaînement fluide.
 */
export function useNameAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [looping, setLooping] = useState(false);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('ended', () => setPlaying(false));
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const play = useCallback((url: string) => {
    const audio = getAudio();
    // Même URL en cours → on coupe la lecture (toggle).
    if (audio.src === url && !audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (audio.src !== url) audio.src = url;
    audio.currentTime = 0;
    audio.loop = looping;
    void audio.play().catch(() => setPlaying(false));
    setPlaying(true);
  }, [getAudio, looping]);

  const toggleLoop = useCallback(() => {
    setLooping((prev) => {
      const next = !prev;
      const audio = audioRef.current;
      if (audio) audio.loop = next;
      return next;
    });
  }, []);

  // Nettoyage au démontage.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeAttribute('src');
      audioRef.current?.load();
    };
  }, []);

  return { playing, looping, play, toggleLoop };
}
