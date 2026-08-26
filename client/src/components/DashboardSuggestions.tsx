import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { currentPeriod, type DayPeriod } from '../lib/suggestions';
import { useMawaqitTimes } from '../hooks/useMawaqitTimes';
import { useDevotion } from '../hooks/useDevotion';

interface Suggestion {
  emoji: string;
  label: string;
  to: string;
  color: string;
}

/** Returns context-aware action suggestions based on current time + prayer status. */
function getSuggestionsForPeriod(
  period: DayPeriod,
  prayersDone: number,
  totalPrayers: number,
  t: (key: string) => string,
): Suggestion[] {
  const allDone = prayersDone >= totalPrayers && totalPrayers > 0;
  const suggestions: Suggestion[] = [];

  switch (period) {
    case 'dawn':
      // After Fajr — morning dhikr, Ayat al-Kursi
      suggestions.push(
        { emoji: '📿', label: t('dashboard.suggest.morningDhikr'), to: '/dhikr', color: 'var(--accent-gold)' },
        { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran', color: 'var(--accent-primary)' },
        { emoji: '🧠', label: t('dashboard.suggest.quiz'), to: '/quiz', color: '#a78bfa' },
      );
      break;
    case 'morning':
      suggestions.push(
        { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran', color: 'var(--accent-primary)' },
        { emoji: '📿', label: t('dashboard.suggest.morningDhikr'), to: '/dhikr', color: 'var(--accent-gold)' },
        { emoji: '✨', label: t('dashboard.suggest.learnNames'), to: '/names', color: '#f472b6' },
      );
      break;
    case 'noon':
      // Dhuhr time
      suggestions.push(
        { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran', color: 'var(--accent-primary)' },
        { emoji: '🧠', label: t('dashboard.suggest.quiz'), to: '/quiz', color: '#a78bfa' },
        { emoji: '📿', label: t('dashboard.suggest.dhikr'), to: '/dhikr', color: 'var(--accent-gold)' },
      );
      break;
    case 'afternoon':
      suggestions.push(
        { emoji: '🧠', label: t('dashboard.suggest.quiz'), to: '/quiz', color: '#a78bfa' },
        { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran', color: 'var(--accent-primary)' },
        { emoji: '📜', label: t('dashboard.suggest.prophets'), to: '/prophets', color: '#fbbf24' },
      );
      break;
    case 'evening':
      // Maghrib time — evening dhikr
      suggestions.push(
        { emoji: '📿', label: t('dashboard.suggest.eveningDhikr'), to: '/dhikr', color: 'var(--accent-gold)' },
        { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran', color: 'var(--accent-primary)' },
        { emoji: '🕌', label: t('dashboard.suggest.checkPrayers'), to: '/prayer', color: 'var(--accent-primary)' },
      );
      break;
    case 'night':
      // Isha time — wind down
      suggestions.push(
        { emoji: '📖', label: t('dashboard.suggest.readQuran'), to: '/quran', color: 'var(--accent-primary)' },
        { emoji: '📅', label: t('dashboard.suggest.hijriCalendar'), to: '/hijri', color: '#818cf8' },
        { emoji: '📚', label: t('dashboard.suggest.glossary'), to: '/glossary', color: '#6ee7b7' },
      );
      break;
  }

  // If all prayers are done, add a congratulations item
  if (allDone) {
    suggestions.unshift({
      emoji: '🎉',
      label: t('dashboard.suggest.allPrayersDone'),
      to: '/',
      color: '#34d399',
    });
  }

  return suggestions.slice(0, 4);
}

export function DashboardSuggestions({ compact = false }: { compact?: boolean } = {}) {
  const { t, lang } = useI18n();
  const pt = useMawaqitTimes();
  const { prayers } = useDevotion();

  const period = useMemo(() => currentPeriod(), []);
  const prayersDone = prayers?.checked?.length ?? 0;
  const totalPrayers = 5;

  const suggestions = useMemo(
    () => getSuggestionsForPeriod(period, prayersDone, totalPrayers, t),
    [period, prayersDone, t],
  );

  // Greeting based on time
  const greeting = useMemo(() => {
    switch (period) {
      case 'dawn': return { emoji: '🌅', text: t('dashboard.greeting.dawn') };
      case 'morning': return { emoji: '☀️', text: t('dashboard.greeting.morning') };
      case 'noon': return { emoji: '🌞', text: t('dashboard.greeting.noon') };
      case 'afternoon': return { emoji: '🌤️', text: t('dashboard.greeting.afternoon') };
      case 'evening': return { emoji: '🌇', text: t('dashboard.greeting.evening') };
      case 'night': return { emoji: '🌙', text: t('dashboard.greeting.night') };
    }
  }, [period, t]);

  return (
    <section className="mb-4">
      {/* Greeting */}
      {!compact && (
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{greeting.emoji}</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
          {greeting.text}
        </p>
      </div>
      )}

      {/* Suggestions */}
      <div className={`grid grid-cols-2 gap-2 ${compact ? "" : "sm:grid-cols-4"}`}>
        {suggestions.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className="card group flex flex-col items-center gap-2 p-3 text-center transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{
              borderColor: `${s.color}30`,
              background: `${s.color}08`,
            }}
          >
            <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{s.emoji}</span>
            <span className="text-[11px] font-medium leading-tight" style={{ color: s.color }}>
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
