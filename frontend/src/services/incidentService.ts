import { apiRequest } from './api';
import type {
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from '../types';

export interface IncidentFilters {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  category?: IncidentCategory;
  shiftId?: string;
}

function buildQuery(filters: IncidentFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function getIncidents(filters: IncidentFilters = {}): Promise<Incident[]> {
  return apiRequest<Incident[]>(`/incidents${buildQuery(filters)}`);
}

export function getIncident(id: string): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}`);
}

export function createIncident(
  data: Partial<Incident> & {
    title: string;
    description: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
  }
): Promise<Incident> {
  return apiRequest<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateIncident(
  id: string,
  data: Partial<Incident>
): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function resolveIncident(id: string): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/resolve`, { method: 'POST' });
}

export function addIncidentNote(id: string, content: string): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
