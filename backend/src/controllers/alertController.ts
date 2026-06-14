import { Response } from 'express';
import { AlertSeverity, AlertStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as alertService from '../services/alertService';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const filters = {
    severity: req.query.severity as AlertSeverity | undefined,
    status: req.query.status as AlertStatus | undefined,
    service: req.query.service as string | undefined,
  };
  const alerts = await alertService.listAlerts(filters);
  res.json(alerts);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const alert = await alertService.getAlertById(req.params.id);
  res.json(alert);
}

export async function generate(req: AuthRequest, res: Response): Promise<void> {
  const count = parseInt((req.body as { count?: number }).count?.toString() ?? '1', 10);
  const alerts = await alertService.generateAlerts(isNaN(count) ? 1 : count);
  res.status(201).json(alerts);
}

export async function acknowledge(req: AuthRequest, res: Response): Promise<void> {
  const alert = await alertService.acknowledgeAlert(req.params.id);
  res.json(alert);
}

export async function dismiss(req: AuthRequest, res: Response): Promise<void> {
  const alert = await alertService.dismissAlert(req.params.id);
  res.json(alert);
}

export async function convertToIncident(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = await alertService.convertAlertToIncident(req.params.id, req.body);
  res.status(201).json(result);
}
