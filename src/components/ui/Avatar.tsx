import { getProfile } from '../../context/CurrentUserContext';

interface Props {
  userId: string;
  username: string;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
  ring?: boolean;
  online?: boolean;
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
  online,
}: Props) {
  const profile = getProfile(userId);
  const bg = color ?? profile?.color ?? '#475569';
  const content = profile?.emoji ?? username.charAt(0).toUpperCase();
  const dot = size === 'lg' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5';
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`inline-flex items-center justify-center rounded-full font-semibold text-white shadow-md ${SIZES[size]} ${
          ring ? 'ring-2 ring-white/70' : ''
        }`}
        style={{
          background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        }}
        title={online ? `${username} · online` : username}
      >
        {content}
      </span>
      {online && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-green-400 ring-2 ring-base-800 ${dot}`}
          title="online"
        />
      )}
    </span>
  );
}
