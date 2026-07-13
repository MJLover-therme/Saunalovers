import Avatar from '../ui/Avatar';
import { usePresence } from '../../context/PresenceContext';
import { useData } from '../../context/DataContext';
import { useCurrentUser } from '../../context/CurrentUserContext';

/**
 * Small header cluster showing which of the OTHER users are currently online.
 * Hidden when nobody else is around.
 */
export default function PresenceBar() {
  const { isOnline } = usePresence();
  const { users } = useData();
  const { currentUser } = useCurrentUser();

  const onlineOthers = users.filter(
    (u) => u.id !== currentUser.id && isOnline(u.id),
  );

  if (onlineOthers.length === 0) return null;

  return (
    <div className="hidden items-center gap-1.5 rounded-full bg-white/5 py-1 pl-2 pr-3 ring-1 ring-white/10 sm:flex">
      <span className="flex -space-x-2">
        {onlineOthers.map((u) => (
          <Avatar
            key={u.id}
            userId={u.id}
            username={u.username}
            color={u.color}
            size="sm"
            online
          />
        ))}
      </span>
      <span className="text-xs font-medium text-green-300">
        {onlineOthers.length === 1
          ? `${onlineOthers[0].username} online`
          : `${onlineOthers.length} online`}
      </span>
    </div>
  );
}
