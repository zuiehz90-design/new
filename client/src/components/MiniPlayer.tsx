import { useAudioPlayer } from '../context/AudioPlayerContext';
import { SpeakerIcon, PrevIcon, PlayIcon, PauseIcon, NextIcon, CloseIcon } from './icons';

export function MiniPlayer() {
  const { state, toggle, stop, prev, next } = useAudioPlayer();

  if (!state) return null;

  const reciterName = state.reciter.replace(/_128kbps|_192kbps|_64kbps/g, '').replace(/_/g, ' ');

  return (
    <div className="fixed bottom-[72px] left-1/2 z-30 w-[92vw] max-w-md -translate-x-1/2 lg:bottom-6">
    <div className="animate-fade-in rounded-2xl border border-emerald-700/50 bg-night-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Cover art / icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800/60 text-lg">
          <SpeakerIcon className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-200">
            {state.surahName} · {state.chapter}:{state.verse}
          </p>
          <p className="truncate text-[11px] text-stone-500">{reciterName}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            disabled={state.verse <= 1}
            className="rounded-lg p-1.5 text-stone-300 hover:bg-emerald-900/30 disabled:opacity-30"
          >
            <PrevIcon className="h-4 w-4" />
          </button>
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-night-950 hover:bg-gold-400"
          >
            {state.playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={next}
            disabled={state.verse >= state.totalVerses}
            className="rounded-lg p-1.5 text-stone-300 hover:bg-emerald-900/30 disabled:opacity-30"
          >
            <NextIcon className="h-4 w-4" />
          </button>
          <button
            onClick={stop}
            className="ml-1 rounded-lg p-1.5 text-stone-400 hover:bg-red-900/20 hover:text-red-400"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar (simple) */}
      <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-emerald-900/40">
        <div
          className={`h-full rounded-full bg-gold-500 transition-all duration-300 ${state.playing ? 'animate-pulse' : ''}`}
          style={{ width: `${(state.verse / state.totalVerses) * 100}%` }}
        />
      </div>
      </div>
    </div>
  );
}
