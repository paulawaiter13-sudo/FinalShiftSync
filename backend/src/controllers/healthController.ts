import { Request, Response } from 'express';
import { getHealthStatus } from '../services/healthService';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const health = await getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}

export function apiInfo(_req: Request, res: Response): void {
  res.json({
    name: 'ShiftSync API',
    version: '1.0.0',
    description: 'Shift Handover Platform REST API',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      dashboard: 'GET /api/dashboard/overview',
      shifts: '/api/shifts',
      incidents: '/api/incidents',
      alerts: '/api/alerts',
      tasks: '/api/tasks',
      summaries: '/api/summaries',
      announcements: '/api/announcements',
    },
  });
}
