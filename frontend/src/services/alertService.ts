import { apiRequest } from './api';
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  ConvertAlertResult,
  IncidentCategory,
  IncidentSeverity,
} from '../types';

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  service?: string;
}

function buildQuery(filters: AlertFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function getAlerts(filters: AlertFilters = {}): Promise<Alert[]> {
  return apiRequest<Alert[]>(`/alerts${buildQuery(filters)}`);
}

export function getAlert(id: string): Promise<Alert> {
  return apiRequest<Alert>(`/alerts/${id}`);
}

export function generateAlerts(count = 1): Promise<Alert[]> {
  return apiRequest<Alert[]>('/alerts/generate', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
}

export function acknowledgeAlert(id: string): Promise<Alert> {
  return apiRequest<Alert>(`/alerts/${id}/acknowledge`, { method: 'PATCH' });
}

export function dismissAlert(id: string): Promise<Alert> {
  return apiRequest<Alert>(`/alerts/${id}/dismiss`, { method: 'PATCH' });
}

export function convertAlertToIncident(
  id: string,
  data?: {
    title?: string;
    description?: string;
    category?: IncidentCategory;
    severity?: IncidentSeverity;
    assignedUserId?: string;
  }
): Promise<ConvertAlertResult> {
  return apiRequest<ConvertAlertResult>(`/alerts/${id}/convert-to-incident`, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  });
}
