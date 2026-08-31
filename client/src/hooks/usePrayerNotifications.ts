import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { push, requestPermission } from '../lib/notifications';
import { getMosqueTimes } from '../lib/mawaqit';
import { PRAYER_KEYS } from '../lib/prayer';

function parseTime(timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  const clean = timeStr.replace(/\s*\([^)]\)/, '').trim();
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d;
}

const PRAYER_LABEL: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

/** Persistance des declenchements du jour : sans ca, chaque rechargement de
 *  page dans la fenetre de tir (±2 min) re-notifiait la meme priere. */
const FIRED_KEY = 'nour:prayer-notif-fired';

function readFired(today: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(map)) {
      if (k.startsWith(today)) out[k] = v; // purge les jours precedents
    }
    return out;
  } catch {
    return {};
  }
}

function writeFired(map: Record<string, string>): void {
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(map)); } catch { /* quota */ }
}

/**
 * Notifications de priere, integrees au systeme unifie 🔔
 * (historique de la cloche + toast in-app + notification native + son) :
 *   - Rappel 10 minutes avant chaque priere
 *   - Notification a l'heure de la priere
 * Chaque type ne se declenche qu'une fois par jour et par priere
 * (marqueur persistant en localStorage : aucun doublon apres rechargement).
 * Les horaires sont ceux de la mosquee configuree (MAWAQIT).
 */
export function usePrayerNotifications() {
  const { settings } = useSettings();
  const lastFired = useRef<Record<string, string> | null>(null);

  const isPaused = settings.prayerPauseUntil && settings.prayerPauseUntil > Date.now();
  const mosqueId = settings.mawaqitMosqueId;
  const focusMode = settings.focusMode === true;

  useEffect(() => {
    // Pas de garde sur l'API Notification : le systeme unifie fonctionne aussi sans
    // elle (cloche 🔔 + toast in-app), et le chemin natif gere son absence tout seul.
    if (!settings.prayerNotifications || !mosqueId || isPaused || focusMode) return;

    let cancelled = false;
    let permissionRequested = false;

    const check = async () => {
      if (cancelled) return;
      try {
        if (!permissionRequested) {
          permissionRequested = true;
          void requestPermission();
        }
        const times = await getMosqueTimes(mosqueId);
        if (!times) return;
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        if (!lastFired.current) lastFired.current = readFired(today);
        const fired = lastFired.current;
        for (const key of PRAYER_KEYS) {
          await new Promise(r => setTimeout(r, 0)); // yield pour async notify
          if (key === 'sunrise') continue;
          const prayerTime = parseTime((times as Record<string, string>)[key]);
          if (!prayerTime) continue;
          const diff = prayerTime.getTime() - now.getTime();
          const label = PRAYER_LABEL[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
          const time = prayerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // Rappel 10 min avant
          const preDiff = prayerTime.getTime() - 10 * 60_000 - now.getTime();
          if (preDiff >= -60_000 && preDiff <= 120_000) {
            const preKey = `${today}-${key}-pre`;
            if (!fired[preKey]) {
              fired[preKey] = now.toISOString();
              writeFired(fired);
              void push({
                type: 'prayer',
                title: `🕌 ${label} dans 10 minutes`,
                body: "Prepare-toi : l'heure de la priere approche.",
                clickUrl: '/prayer',
              });
            }
          }

          // A l'heure
          if (diff >= -60_000 && diff <= 120_000) {
            const timeKey = `${today}-${key}-time`;
            if (!fired[timeKey]) {
              fired[timeKey] = now.toISOString();
              writeFired(fired);
              void push({
                type: 'prayer',
                title: `🕌 ${label} — ${time}`,
                body: "C'est l'heure de la priere.",
                clickUrl: '/prayer',
              });
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
  }, [settings.prayerNotifications, mosqueId, isPaused, focusMode]);
}
