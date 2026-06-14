import { Response } from 'express';
import {
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as incidentService from '../services/incidentService';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const filters = {
    severity: req.query.severity as IncidentSeverity | undefined,
    status: req.query.status as IncidentStatus | undefined,
    category: req.query.category as IncidentCategory | undefined,
    shiftId: req.query.shiftId as string | undefined,
  };
  const incidents = await incidentService.listIncidents(filters);
  res.json(incidents);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const incident = await incidentService.getIncidentById(req.params.id);
  res.json(incident);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const incident = await incidentService.createIncident(req.body);
  res.status(201).json(incident);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const incident = await incidentService.updateIncident(req.params.id, req.body);
  res.json(incident);
}

export async function resolve(req: AuthRequest, res: Response): Promise<void> {
  const incident = await incidentService.resolveIncident(req.params.id);
  res.json(incident);
}

export async function addNote(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { content } = req.body as { content?: string };
  const incident = await incidentService.addIncidentNote(
    req.params.id,
    req.user.userId,
    content ?? ''
  );
  res.json(incident);
}
