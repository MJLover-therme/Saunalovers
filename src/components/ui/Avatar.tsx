import { getProfile } from '../../context/CurrentUserContext';

interface Props {
  userId: string;
  username: string;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
  ring?: boolean;
}

const SIZES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-12 h-12 text-xl',
};

/** Round user avatar: emoji from the profile, tinted with the user's color. */
export default function Avatar({
  userId,
  username,
  color,
  size = 'md',
  ring = false,
}: Props) {
  const profile = getProfile(userId);
  const bg = color ?? profile?.color ?? '#475569';
  const content = profile?.emoji ?? username.charAt(0).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shadow-md ${SIZES[size]} ${
        ring ? 'ring-2 ring-white/70' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      }}
      title={username}
    >
      {content}
    </span>
  );
}
