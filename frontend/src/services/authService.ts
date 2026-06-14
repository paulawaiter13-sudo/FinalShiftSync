import { apiRequest } from './api';
import type { LoginResponse, User } from '../types';

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me');
}
