import { apiRequest } from './api';
import type { Shift, ShiftStatus } from '../types';

export function getShifts(status?: ShiftStatus): Promise<Shift[]> {
  const params = status ? `?status=${status}` : '';
  return apiRequest<Shift[]>(`/shifts${params}`);
}

export function getCurrentShift(): Promise<Shift | null> {
  return apiRequest<Shift | null>('/shifts/current');
}

export function getShift(id: string): Promise<Shift> {
  return apiRequest<Shift>(`/shifts/${id}`);
}

export function createShift(data: {
  shiftType: string;
  startTime: string;
  endTime: string;
  responsibleId: string;
  handoverNotes?: string;
}): Promise<Shift> {
  return apiRequest<Shift>('/shifts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateShift(
  id: string,
  data: Partial<{
    handoverNotes: string;
    responsibleId: string;
    shiftType: string;
    startTime: string;
    endTime: string;
  }>
): Promise<Shift> {
  return apiRequest<Shift>(`/shifts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function startShift(id: string): Promise<Shift> {
  return apiRequest<Shift>(`/shifts/${id}/start`, { method: 'POST' });
}

export function endShift(id: string, handoverNotes?: string): Promise<Shift> {
  return apiRequest<Shift>(`/shifts/${id}/end`, {
    method: 'POST',
    body: JSON.stringify({ handoverNotes }),
  });
}
