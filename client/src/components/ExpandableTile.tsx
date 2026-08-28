import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

interface Props {
  emoji: string;
  title: string;
  children?: ReactNode;
  /** Route cible : si fournie, la tuile redirige vers la page associée au lieu de se déplier. */
  to?: string;
}

/** Tuile compacte : petite tuile au repos, contenu complet une fois dépliée,
 *  ou redirection vers la page associée quand une route `to` est fournie. */
export function ExpandableTile({ emoji, title, children, to }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Mode « redirection » : la tuile est un lien vers la page associée.
  if (to) {
    return (
      <Link
        to={to}
        className="card card-clickable flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span className="text-2xl">{emoji}</span>
        <span className="font-display flex-1 text-sm font-bold text-gold-300">{title}</span>
        <span className="text-gold-400" aria-hidden>▸</span>
      </Link>
    );
  }

  if (open) {
    return (
      <div className="flex flex-col">
        <button
          onClick={() => setOpen(false)}
          className="mb-1.5 self-end rounded-full border border-gold-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-gold-300 transition hover:bg-gold-500/10"
        >
          ▲ {t('common.close')}
        </button>
        {children}
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="card card-clickable flex w-full items-center gap-3 p-3.5 text-left"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-display flex-1 text-sm font-bold text-gold-300">{title}</span>
      <span className="text-gold-400" aria-hidden>▸</span>
    </button>
  );
}
