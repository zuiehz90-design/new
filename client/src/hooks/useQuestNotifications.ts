import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { fetchMawaqitTimes } from '../lib/mawaqit';
import { type PrayerKey } from '../lib/prayer';

interface Trigger {
  keywords: string[];
  prayerOffset: number;
  targetPrayer: PrayerKey;
  message: string;
}

const TRIGGERS: Trigger[] = [
  {
    keywords: ['avant de dormir', 'dormir', 'coucher', 'before sleeping', 'before bed', 'sleep'],
    prayerOffset: 45,
    targetPrayer: 'isha',
    message: '🌙 Pense à ta quête avant de dormir',
  },
  {
    keywords: ['après la prière', 'après chaque prière', 'after prayer', 'after each prayer'],
    prayerOffset: -5,
    targetPrayer: 'fajr',
    message: '🤲 N\'oublie pas tes adhkars après la prière',
  },
  {
    keywords: ['matin', 'fajr', 'aube', 'matinale', 'morning', 'dawn'],
    prayerOffset: -15,
    targetPrayer: 'fajr',
    message: '☀️ Ta quête du matin t\'attend',
  },
  {
    keywords: ['soir', 'maghrib', 'crépuscule', 'evening', 'sunset'],
    prayerOffset: 30,
    targetPrayer: 'maghrib',
    message: '🌅 Pense à ta quête du soir',
  },
  {
    keywords: ['adhan', 'appel à la prière', 'call to prayer', 'dès l\'adhan'],
    prayerOffset: 5,
    targetPrayer: 'dhuhr',
    message: '📢 L\'adhan approche, prépare ta quête',
  },
  {
    keywords: ['dhikr', 'subhanallah', 'istighfar', 'tasbih'],
    prayerOffset: 60,
    targetPrayer: 'asr',
    message: '📿 Un petit moment de dhikr ?',
  },
  {
    keywords: ['lis', 'coran', 'récite', 'sourate', 'read', 'quran', 'recite'],
    prayerOffset: -30,
    targetPrayer: 'dhuhr',
    message: '📖 Un moment pour le Coran ?',
  },
];

function matchTrigger(title: string, description: string): Trigger | null {
  const text = (title + ' ' + description).toLowerCase();
  for (const trigger of TRIGGERS) {
    if (trigger.keywords.some((kw) => text.includes(kw))) return trigger;
  }
  return null;
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

/**
 * Notifications contextuelles pour les quêtes, basées sur les horaires MAWAQIT.
 */
export function useQuestNotifications() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const lastFired = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!settings.prayerNotifications || !user || !settings.mawaqitMosqueId) return;

    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      try {
        const token = localStorage.getItem('nour:token');
        if (!token) return;
        const res = await fetch('/api/quests', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const quests: Array<{ quest_id: string; title: string; description: string; done: number }> = data.quests ?? [];

        const pending = quests.filter((q) => !q.done);
        if (pending.length === 0) return;

        const times = await fetchMawaqitTimes(settings.mawaqitMosqueId!);
        if (!times) return;

        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const keyMap: Record<string, PrayerKey> = {
          fajr: 'fajr', dohr: 'dhuhr', asr: 'asr', maghreb: 'maghrib', icha: 'isha',
        };

        for (const quest of pending) {
          const trigger = matchTrigger(quest.title, quest.description);
          if (!trigger) continue;

          const fireKey = `${quest.quest_id}-${today}`;
          if (lastFired.current[fireKey]) continue;

          const srcKey = Object.keys(keyMap).find((k) => keyMap[k] === trigger.targetPrayer);
          if (!srcKey) continue;
          const targetTime = parseTime(times[srcKey] as string | undefined);
          if (!targetTime) continue;

          const fireTime = new Date(targetTime.getTime() - trigger.prayerOffset * 60_000);
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
  }, [settings.prayerNotifications, settings.mawaqitMosqueId, user]);
}
