import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { MoonIcon } from './icons';
import { ProfileAvatar } from './ProfileAvatar';

/**
 * Indicateur d'attente pendant la génération IA.
 * Affiche des phases progressives (analyse → sources → rédaction), un compteur
 * du temps écoulé et des conseils rotatifs pour faire patienter agréablement.
 */

/** Conseils éducatifs rotatifs (durée d'attente moyenne des modèles gratuits). */
const TIPS: string[] = [
  "💡 L'aumône (Zakat) purifie les richesses.",
  "💡 Le Coran compte 114 sourates et 6 236 versets.",
  "💡 Le mot « Islam » signifie « soumission à Dieu ».",
  "💡 La sourate Al-Fatiha est récitée dans chaque rak'a de la prière.",
  "💡 Les 99 noms d'Allah décrivent Ses attributs divins.",
  "💡 Le Ramadan est le mois de la révélation du Coran.",
  "💡 « Subhan Allah » signifie « Gloire à Allah ».",
  "💡 La prière du vendredi est obligatoire pour les hommes.",
  "💡 Le Hajj est obligatoire une fois dans la vie si possible.",
  "💡 La patience (Sabr) est citée plus de 70 fois dans le Coran.",
  "💡 La première révélation fut « Lis, au nom de ton Seigneur ».",
  "💡 L'ablution purifie le corps et l'intention purifie le cœur.",
  "💡 Chaque lettre du Coran récitée compte comme une bonne action.",
  "💡 La nuit du destin (Laylat al-Qadr) vaut mieux que 1000 mois.",
];

/** Temps (ms) après lesquels chaque phase d'attente est considérée atteinte. */
const PHASE_THRESHOLDS = [0, 3000, 7000];

export function ThinkingIndicator() {
  const { t } = useI18n();
  const startRef = useRef(Date.now());

  // Phase d'attente : analyse → sources → rédaction, selon le temps écoulé.
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const id = setInterval(() => {
      const ms = Date.now() - startRef.current;
      setElapsed(ms);
      let p = 0;
      for (let i = 0; i < PHASE_THRESHOLDS.length; i++) {
        if (ms >= PHASE_THRESHOLDS[i]) p = i;
      }
      setPhase(p);
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Conseil rotatif toutes les 5 secondes (avec transition douce).
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const phases = useMemo(
    () => [
      t('chat.thinking.analyzing'),
      t('chat.thinking.sources'),
      t('chat.thinking.writing'),
    ],
    [t],
  );

  const seconds = Math.floor(elapsed / 1000);
  const timeLabel =
    seconds < 1 ? t('chat.thinking.justNow') : `${seconds} s`;

  return (
    <div className="flex items-start gap-3 pl-1">
      <div className="thinking-moon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10">
        <MoonIcon className="h-4 w-4 text-gold-400" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <p key={phase} className="phase-in text-[13px] font-medium text-gold-200">
            {phases[phase]}
          </p>
          <span className="shrink-0 rounded-full border border-gold-500/25 bg-gold-500/5 px-2 py-0.5 text-[10px] tabular-nums text-stone-400">
            {timeLabel}
          </span>
        </div>
        <p key={tipIndex} className="phase-in truncate text-[11px] italic text-stone-500">
          {TIPS[tipIndex]}
        </p>
      </div>
      <ProfileAvatar size={34} className="mt-0.5" />
    </div>
  );
}
