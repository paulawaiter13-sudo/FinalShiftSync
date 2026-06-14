import { AnnouncementPriority, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';

const announcementInclude = {
  creator: { select: { id: true, fullName: true, email: true, role: true } },
} satisfies Prisma.AnnouncementInclude;

export interface AnnouncementFilters {
  priority?: AnnouncementPriority;
  includeExpired?: boolean;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}

export async function listAnnouncements(filters: AnnouncementFilters = {}) {
  const where: Prisma.AnnouncementWhereInput = {};

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (!filters.includeExpired) {
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  }

  return prisma.announcement.findMany({
    where,
    include: announcementInclude,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getAnnouncementById(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: announcementInclude,
  });

  if (!announcement) throw new AppError(404, 'Announcement not found');
  return announcement;
}

export async function createAnnouncement(
  createdBy: string,
  input: CreateAnnouncementInput
) {
  if (!input.title?.trim() || !input.content?.trim()) {
    throw new AppError(400, 'Title and content are required');
  }

  return prisma.announcement.create({
    data: {
      title: input.title.trim(),
      content: input.content.trim(),
      priority: input.priority ?? AnnouncementPriority.NORMAL,
      createdBy,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
    include: announcementInclude,
  });
}

export async function updateAnnouncement(id: string, input: UpdateAnnouncementInput) {
  await getAnnouncementById(id);

  return prisma.announcement.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.content && { content: input.content.trim() }),
      ...(input.priority && { priority: input.priority }),
      ...(input.expiresAt !== undefined && {
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      }),
    },
    include: announcementInclude,
  });
}

export async function deleteAnnouncement(id: string) {
  await getAnnouncementById(id);
  await prisma.announcement.delete({ where: { id } });
}
