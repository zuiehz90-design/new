import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useGeolocation } from './useGeolocation';
import { useAuth } from '../context/AuthContext';
import { computePrayers, PRAYER_KEYS, type PrayerKey } from '../lib/prayer';

/**
 * Patterns → déclencheur temporel
 * Chaque pattern est un mot/phrase présent dans le titre ou la description.
 */
interface Trigger {
  keywords: string[];          // mots dans le titre/description
  prayerOffset: number;        // minutes avant (>0) ou après (<0) la prière cible
  targetPrayer: PrayerKey;     // prière de référence
  message: string;             // texte de la notif
}

const TRIGGERS: Trigger[] = [
  // --- Avant de dormir → 45 min avant Isha ---
  {
    keywords: ['avant de dormir', 'dormir', 'coucher', 'before sleeping', 'before bed', 'sleep'],
    prayerOffset: 45,
    targetPrayer: 'isha',
    message: '🌙 Pense à ta quête avant de dormir',
  },
  // --- Après la prière → 5 min après chaque prière ---
  {
    keywords: ['après la prière', 'après chaque prière', 'after prayer', 'after each prayer'],
    prayerOffset: -5,
    targetPrayer: 'fajr',
    message: '🤲 N\'oublie pas tes adhkars après la prière',
  },
  // --- Matin / Fajr → 15 min après Fajr ---
  {
    keywords: ['matin', 'fajr', 'aube', 'matinale', 'morning', 'dawn'],
    prayerOffset: -15,
    targetPrayer: 'fajr',
    message: '☀️ Ta quête du matin t\'attend',
  },
  // --- Soir → 30 min avant Maghrib ---
  {
    keywords: ['soir', 'maghrib', 'crépuscule', 'evening', 'sunset'],
    prayerOffset: 30,
    targetPrayer: 'maghrib',
    message: '🌅 Pense à ta quête du soir',
  },
  // --- Dès l'adhan → 5 min avant la prière ---
  {
    keywords: ['adhan', 'appel à la prière', 'call to prayer', 'dès l\'adhan'],
    prayerOffset: 5,
    targetPrayer: 'dhuhr',
    message: '📢 L\'adhan approche, prépare ta quête',
  },
  // --- Dhikr / Istighfar → rappel milieu de journée (avant Asr) ---
  {
    keywords: ['dhikr', 'subhanallah', 'istighfar', 'tasbih'],
    prayerOffset: 60,
    targetPrayer: 'asr',
    message: '📿 Un petit moment de dhikr ?',
  },
  // --- Coran / récitation → rappel après Dhuhr ---
  {
    keywords: ['lis', 'coran', 'récite', 'sourate', 'read', 'quran', 'recite'],
    prayerOffset: -30,
    targetPrayer: 'dhuhr',
    message: '📖 Un moment pour le Coran ?',
  },
];

/**
 * Vérifie si une quête correspond à un déclencheur.
 */
function matchTrigger(title: string, description: string): Trigger | null {
  const text = (title + ' ' + description).toLowerCase();
  for (const trigger of TRIGGERS) {
    if (trigger.keywords.some((kw) => text.includes(kw))) {
      return trigger;
    }
  }
  return null;
}

/**
 * Hook de notifications contextuelles pour les quêtes.
 *
 * Lit les quêtes du jour, détecte les patterns temporels
 * (« avant de dormir », « matin », etc.) et planifie des
 * notifications navigateur aux bons moments (basés sur
 * les horaires de prière).
 *
 * Une seule notification par quête + jour.
 */
export function useQuestNotifications() {
  const { settings } = useSettings();
  const { coords } = useGeolocation();
  const { user } = useAuth();
  const lastFired = useRef<Record<string, string>>({}); // questId-date -> heure ISO

  useEffect(() => {
    if (!settings.prayerNotifications || !user || !coords) return;

    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      try {
        // Récupérer les quêtes du jour
        const token = localStorage.getItem('nour:token');
        if (!token) return;
        const res = await fetch('/api/quests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const quests: Array<{
          quest_id: string;
          title: string;
          description: string;
          done: number;
        }> = data.quests ?? [];

        // Filtrer les quêtes non terminées
        const pending = quests.filter((q) => !q.done);
        if (pending.length === 0) return;

        // Calculer les horaires de prière
        const pt = computePrayers(coords, settings.prayerMethod);
        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        for (const quest of pending) {
          const trigger = matchTrigger(quest.title, quest.description);
          if (!trigger) continue;

          const fireKey = `${quest.quest_id}-${today}`;
          if (lastFired.current[fireKey]) continue;

          // Calculer l'heure de déclenchement
          // On clone toutes les prières de la journée
          // Pour chaque prière cible, on calcule l'offset
          const targetTime = pt[trigger.targetPrayer];
          if (!targetTime) continue;

          // Appliquer l'offset : negatif = après la prière, positif = avant
          const fireTime = new Date(targetTime.getTime() - trigger.prayerOffset * 60_000);

          // Vérifier si on est dans la fenêtre de déclenchement
          // (±2 min autour de l'heure calculée)
          const diff = fireTime.getTime() - now.getTime();
          if (diff >= -120_000 && diff <= 120_000) {
            lastFired.current[fireKey] = now.toISOString();

            const body = `📋 « ${quest.title} »\n${trigger.message}`;
            try {
              new Notification('⚔️ Quête du jour', { body, icon: '/icon.svg' });
            } catch {
              /* notifications non supportées */
            }
          }
        }
      } catch {
        /* ignore */
      }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings.prayerNotifications, settings.prayerMethod, coords, user]);
}
