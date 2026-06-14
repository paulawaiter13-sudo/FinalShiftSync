import { Response } from 'express';
import { ShiftStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as shiftService from '../services/shiftService';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const status = req.query.status as ShiftStatus | undefined;
  const shifts = await shiftService.listShifts({ status });
  res.json(shifts);
}

export async function current(_req: AuthRequest, res: Response): Promise<void> {
  const shift = await shiftService.getCurrentShift();
  res.json(shift);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const shift = await shiftService.getShiftById(req.params.id);
  res.json(shift);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const shift = await shiftService.createShift(req.body);
  res.status(201).json(shift);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const shift = await shiftService.updateShift(req.params.id, req.body);
  res.json(shift);
}

export async function start(req: AuthRequest, res: Response): Promise<void> {
  const shift = await shiftService.startShift(req.params.id);
  res.json(shift);
}

export async function end(req: AuthRequest, res: Response): Promise<void> {
  const { handoverNotes } = req.body as { handoverNotes?: string };
  const shift = await shiftService.endShift(req.params.id, handoverNotes);
  res.json(shift);
}
