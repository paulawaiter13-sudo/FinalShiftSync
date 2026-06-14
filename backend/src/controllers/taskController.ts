import { Response } from 'express';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as taskService from '../services/taskService';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const filters = {
    status: req.query.status as TaskStatus | undefined,
    priority: req.query.priority as TaskPriority | undefined,
    shiftId: req.query.shiftId as string | undefined,
  };
  const tasks = await taskService.listTasks(filters);
  res.json(tasks);
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const task = await taskService.getTaskById(req.params.id);
  res.json(task);
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const task = await taskService.createTask(req.body);
  res.status(201).json(task);
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.json(task);
}

export async function remove(req: AuthRequest, res: Response): Promise<void> {
  await taskService.deleteTask(req.params.id);
  res.status(204).send();
}
