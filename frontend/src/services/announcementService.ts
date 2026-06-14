import { apiRequest } from './api';
import type { Announcement, AnnouncementPriority } from '../types';

export interface AnnouncementFilters {
  priority?: AnnouncementPriority;
  includeExpired?: boolean;
}

function buildQuery(filters: AnnouncementFilters): string {
  const params = new URLSearchParams();
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.includeExpired) params.set('includeExpired', 'true');
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function getAnnouncements(
  filters: AnnouncementFilters = {}
): Promise<Announcement[]> {
  return apiRequest<Announcement[]>(`/announcements${buildQuery(filters)}`);
}

export function getAnnouncement(id: string): Promise<Announcement> {
  return apiRequest<Announcement>(`/announcements/${id}`);
}

export function createAnnouncement(data: {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}): Promise<Announcement> {
  return apiRequest<Announcement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAnnouncement(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    priority: AnnouncementPriority;
    expiresAt: string | null;
  }>
): Promise<Announcement> {
  return apiRequest<Announcement>(`/announcements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteAnnouncement(id: string): Promise<void> {
  return apiRequest<void>(`/announcements/${id}`, { method: 'DELETE' });
}
