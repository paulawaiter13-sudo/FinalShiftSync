import { prisma } from '../prisma/client';

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { fullName: 'asc' },
  });
}
