import { useCallback, useEffect, useState } from 'react';
import { getAnnouncements } from '../services/announcementService';
import { isAnnouncementRead } from '../utils/announcements';

export function useUnreadAnnouncements() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const list = await getAnnouncements({ includeExpired: false });
      setUnreadCount(list.filter((a) => !isAnnouncementRead(a.id)).length);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    window.addEventListener('announcements-read', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('announcements-read', handler);
    };
  }, [refresh]);

  return { unreadCount, refresh };
}
