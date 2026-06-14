import { apiRequest } from './api';
import type { User } from '../types';

export function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users');
}
