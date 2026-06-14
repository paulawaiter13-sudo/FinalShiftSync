import { apiRequest } from './api';
import type { ShiftSummary } from '../types';

export function getSummaries(): Promise<ShiftSummary[]> {
  return apiRequest<ShiftSummary[]>('/summaries');
}

export function getShiftSummaries(shiftId: string): Promise<ShiftSummary[]> {
  return apiRequest<ShiftSummary[]>(`/shifts/${shiftId}/summary`);
}

export function generateSummary(shiftId: string): Promise<ShiftSummary> {
  return apiRequest<ShiftSummary>(`/shifts/${shiftId}/generate-summary`, {
    method: 'POST',
  });
}

export function updateSummary(
  id: string,
  generatedText: string
): Promise<ShiftSummary> {
  return apiRequest<ShiftSummary>(`/summaries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ generatedText }),
  });
}

export function getSummary(id: string): Promise<ShiftSummary> {
  return apiRequest<ShiftSummary>(`/summaries/${id}`);
}
