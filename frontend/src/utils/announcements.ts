const READ_KEY = 'shiftsync_read_announcements';

export function getReadAnnouncementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markAnnouncementRead(id: string): void {
  const ids = getReadAnnouncementIds();
  ids.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function isAnnouncementRead(id: string): boolean {
  return getReadAnnouncementIds().has(id);
}

export function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
