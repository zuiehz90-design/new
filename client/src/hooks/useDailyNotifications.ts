import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { push, requestPermission } from '../lib/notifications';
import { getMosqueTimes } from '../lib/mawaqit';
import { PRAYER_KEYS } from '../lib/prayer';
import { getFeaturedProphet } from '../lib/prophets';

/**
 * Notifications quotidiennes intelligentes :
 *   - 📖 Verset du jour (matin)
 *   - 📿 Rappel de dhikr (matin)
 *   - 🌙 Rappel du soir / sommeil (après Isha)
 *   - 🔥 Rappel de streak (soir, si série en cours)
 * Chaque type ne se déclenche qu'une fois par jour (suivi localStorage).
 */
const LAST_FIRED_KEY = 'nour:daily-notif-fired';

function firedOn(type: string): string | null {
  try {
    const raw = localStorage.getItem(LAST_FIRED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return map[type] ?? null;
  } catch {
    return null;
  }
}

function markFired(type: string): void {
  try {
    const raw = localStorage.getItem(LAST_FIRED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[type] = new Date().toISOString().slice(0, 10);
    localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(map));
  } catch {}
}

function parseTime(timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s*\([^)]*\)/, '').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

export function useDailyNotifications() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const lastFired = useRef<Record<string, string>>({});

  const mosqueId = settings.mawaqitMosqueId;
  const focusMode = settings.focusMode === true;
  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();

  useEffect(() => {
    if (!settings.prayerNotifications || focusMode || isPaused) return;

    let cancelled = false;
    let permissionRequested = false;

    const check = async () => {
      if (cancelled) return;
      try {
        const times = mosqueId ? await getMosqueTimes(mosqueId) : null;
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const nowMin = hour * 60 + minutes;

        // Demande la permission au premier cycle
        if (!permissionRequested) {
          permissionRequested = true;
          void requestPermission();
        }

        // Récupère les horaires de prière (ou utilise des heures par défaut)
        let fajr: Date | null = null;
        let isha: Date | null = null;
        if (times) {
          fajr = parseTime((times as Record<string, string>).fajr);
          isha = parseTime((times as Record<string, string>).isha);
        }

        // 1. Verset du jour — matin (Fajr + 30min, ou 8h00)
        const verseKey = `verse-${today}`;
        if (!lastFired.current[verseKey] && !firedOn('verse')) {
          const verseTarget = fajr ? fajr.getHours() * 60 + fajr.getMinutes() + 30 : 8 * 60;
          if (nowMin >= verseTarget) {
            lastFired.current[verseKey] = today;
            markFired('verse');
            void push({
              type: 'dailyVerse',
              title: '📖 Verset du jour',
              body: 'Un verset pour nourrir ton cœur est prêt sur ton tableau de bord.',
              clickUrl: '/',
            });
          }
        }

        // 2. Rappel de dhikr — matin (Fajr + 60min, ou 9h00)
        const dhikrKey = `dhikr-${today}`;
        if (!lastFired.current[dhikrKey] && !firedOn('dhikr')) {
          const dhikrTarget = fajr ? fajr.getHours() * 60 + fajr.getMinutes() + 60 : 9 * 60;
          if (nowMin >= dhikrTarget) {
            lastFired.current[dhikrKey] = today;
            markFired('dhikr');
            void push({
              type: 'dhikr',
              title: '📿 Un moment de dhikr ?',
              body: 'SubhanAllah, Alhamdulillah, Allahu akbar — des mots légers qui pèsent lourd dans la balance.',
              clickUrl: '/dhikr',
            });
          }
        }

        // 3. Rappel du soir / sommeil — après Isha (+45min, ou 22h30)
        const sleepKey = `sleep-${today}`;
        if (!lastFired.current[sleepKey] && !firedOn('sleep')) {
          const sleepTarget = isha ? isha.getHours() * 60 + isha.getMinutes() + 45 : 22 * 60 + 30;
          if (nowMin >= sleepTarget) {
            lastFired.current[sleepKey] = today;
            markFired('sleep');
            void push({
              type: 'sleep',
              title: '🌙 Prépare-toi à dormir',
              body: 'Récite tes adhkars du soir et termine ta journée en paix.',
              clickUrl: '/dhikr',
            });
          }
        }

        // 4. Rappel de streak — soir si série en cours et prières du jour incomplètes
        const streakKey = `streak-${today}`;
        if (!lastFired.current[streakKey] && !firedOn('streak') && user) {
          const streakTarget = isha ? isha.getHours() * 60 + isha.getMinutes() - 60 : 20 * 60;
          if (nowMin >= streakTarget) {
            lastFired.current[streakKey] = today;
            markFired('streak');
            void push({
              type: 'streak',
              title: '🔥 Garde ta série !',
              body: 'N\'oublie pas de compléter tes prières du jour pour maintenir ta série.',
              clickUrl: '/prayer',
            });
          }
        }

        // 5. Défi de la semaine — prophète en vedette (matin, Fajr + 90min ou 10h00)
        const storyKey = 'story-' + today;
        if (!lastFired.current[storyKey] && !firedOn('story')) {
          const storyTarget = fajr ? fajr.getHours() * 60 + fajr.getMinutes() + 90 : 10 * 60;
          if (nowMin >= storyTarget) {
            lastFired.current[storyKey] = today;
            markFired('story');
            const featured = getFeaturedProphet();
            void push({
              type: 'story',
              title: '📖 Défi de la semaine',
              body: "Lis l'histoire de " + featured.prophet.nameFr + " — le prophète de la semaine.",
              clickUrl: '/prophets',
            });
          }
        }
      } catch {
        /* ignore */
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings.prayerNotifications, mosqueId, focusMode, isPaused, user]);
}
