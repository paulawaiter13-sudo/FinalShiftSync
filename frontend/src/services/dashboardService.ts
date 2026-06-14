import { apiRequest } from './api';
import type { DashboardOverview } from '../types';

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>('/dashboard/overview');
}
