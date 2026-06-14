import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';
import { JwtPayload } from '../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

function sanitizeUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, password } = input;

  if (!email?.trim() || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, 'Server configuration error');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

  return { token, user: sanitizeUser(user) };
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return sanitizeUser(user);
}
