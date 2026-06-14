import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as aiSummaryService from '../services/aiSummaryService';

export async function list(_req: AuthRequest, res: Response): Promise<void> {
  const summaries = await aiSummaryService.listSummaries();
  res.json(summaries);
}

export async function getByShift(req: AuthRequest, res: Response): Promise<void> {
  const summaries = await aiSummaryService.getSummariesForShift(req.params.id);
  res.json(summaries);
}

export async function generate(req: AuthRequest, res: Response): Promise<void> {
  const summary = await aiSummaryService.generateSummaryForShift(req.params.id);
  res.status(201).json(summary);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const summary = await aiSummaryService.getSummaryById(req.params.id);
  res.json(summary);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const { generatedText } = req.body as { generatedText?: string };
  const summary = await aiSummaryService.updateSummary(
    req.params.id,
    generatedText ?? ''
  );
  res.json(summary);
}
