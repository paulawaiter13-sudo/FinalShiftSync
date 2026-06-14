import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { login as loginService, getMe } from '../services/authService';

export async function login(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const result = await loginService(req.body);
  res.json(result);
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const user = await getMe(req.user.userId);
  res.json({ user });
}
