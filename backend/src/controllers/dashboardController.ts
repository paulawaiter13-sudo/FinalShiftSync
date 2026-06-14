import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDashboardOverview } from '../services/dashboardService';

export async function overview(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  const data = await getDashboardOverview();
  res.json(data);
}
