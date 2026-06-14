import { Response } from 'express';
import { AnnouncementPriority } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as announcementService from '../services/announcementService';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const filters = {
    priority: req.query.priority as AnnouncementPriority | undefined,
    includeExpired: req.query.includeExpired === 'true',
  };
  const announcements = await announcementService.listAnnouncements(filters);
  res.json(announcements);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const announcement = await announcementService.getAnnouncementById(req.params.id);
  res.json(announcement);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const announcement = await announcementService.createAnnouncement(
    req.user.userId,
    req.body
  );
  res.status(201).json(announcement);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const announcement = await announcementService.updateAnnouncement(
    req.params.id,
    req.body
  );
  res.json(announcement);
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  await announcementService.deleteAnnouncement(req.params.id);
  res.status(204).send();
}
