import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useNameAudio } from '../hooks/useNameAudio';
import { nameOfTheDay, meditationFor } from '../lib/nameOfTheDay';
import { NameQuranLinks } from './NameQuranLinks';
import { NAMES_99 } from '../lib/names99';

/**
 * « Nom du jour » : un des 99 Noms mis en avant chaque jour sur l'accueil,
 * avec sa signification, un rappel de méditation et sa prononciation.
 * Le nom change à minuit (UTC) et est le même pour tous — rituel quotidien.
 */
export function NameOfTheDay({ showLink = true }: { showLink?: boolean }) {
  const { t } = useI18n();
  const audio = useNameAudio();
  const name = nameOfTheDay();

  return (
    <section className="card mb-4 border-gold-500/40 bg-gradient-to-br from-gold-900/15 via-transparent to-amber-900/10 p-4 shadow-glow">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gold-400">✨ {t('names99.daily')}</h2>
        <button
          onClick={() => audio.play(name.audio)}
          className={`chip hover:!border-gold-500/50 hover:!text-gold-300 ${audio.playing ? '!border-gold-500/70 !text-gold-300' : ''}`}
          title={t('names99.audioPlay')}
          aria-label={t('names99.audioPlay')}
        >
          {audio.playing ? '⏹' : '🔊'} {t('names99.audioPlay')}
        </button>
      </div>

      <div className="text-center">
        <p className="font-quran text-4xl text-gold-300" dir="rtl">{name.arabic}</p>
        <p className="mt-2 text-lg font-bold text-gold-400">{name.transliteration}</p>
        <p className="mt-1 text-sm font-semibold text-stone-100">{name.translation}</p>
        <p className="mt-2 text-xs leading-relaxed text-stone-400">{name.description}</p>
      </div>

      {/* Rappel de méditation */}
      <div className="mt-3 rounded-xl border border-gold-500/25 bg-gold-500/5 px-3 py-2 text-center">
        <p className="text-[11px] italic leading-relaxed text-gold-200/90">🕊️ {meditationFor(name)}</p>
      </div>

      {/* Versets liés dans le Coran */}
      <NameQuranLinks nameIndex={NAMES_99.indexOf(name)} arabicName={name.arabic} />

      {showLink && (
        <div className="mt-3 flex justify-center">
          <Link to="/names" className="btn-ghost text-xs">
            📿 {t('names99.allNames')}
          </Link>
        </div>
      )}
    </section>
  );
}
