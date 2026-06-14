import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { listUsers } from '../services/userService';

export async function getUsers(_req: AuthRequest, res: Response): Promise<void> {
  const users = await listUsers();
  res.json(users);
}
