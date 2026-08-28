import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVATARS, getAccent, acMap } from '../lib/profileOptions';
import { UserIcon } from './icons';

interface Props {
  /** Taille du rond en pixels (défaut 32). */
  size?: number;
  className?: string;
}

/**
 * Avatar rond du profil utilisateur : initiale du nom (ou emoji choisi),
 * cerclé de la couleur d'accent du profil. Cliquer redirige vers /profile.
 */
export function ProfileAvatar({ size = 32, className = '' }: Props) {
  const { user } = useAuth();

  const avatarId = (user?.profile?.avatar as string | undefined) ?? 'initial';
  const avatarDef = AVATARS.find((a) => a.id === avatarId);
  const isInitial = !avatarDef || avatarDef.id === 'initial';
  const initial = isInitial ? (user?.name?.trim()?.charAt(0)?.toUpperCase() ?? '') : '';
  const accentId = (user?.profile?.accent as string | undefined) ?? 'gold';
  const accent = getAccent(accentId);
  const colors = acMap[accent.id] ?? acMap.gold;

  return (
    <Link
      to="/profile"
      aria-label="Profil"
      title={user?.name?.trim() || 'Profil'}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 hover:opacity-90 ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: colors.h,
        background: colors.b,
        color: colors.h,
        fontSize: size * 0.42,
      }}
    >
      {!user ? (
        <UserIcon className="h-1/2 w-1/2" />
      ) : isInitial ? (
        <span className="font-bold leading-none">{initial || '?'}</span>
      ) : (
        <span className="leading-none" style={{ fontSize: size * 0.52 }}>
          {avatarDef!.icon}
        </span>
      )}
    </Link>
  );
}
