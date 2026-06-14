import {
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  IncidentSource,
  Prisma,
} from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';

const incidentInclude = {
  assignedUser: { select: { id: true, fullName: true, email: true } },
  shift: {
    select: { id: true, shiftType: true, startTime: true, endTime: true },
  },
} satisfies Prisma.IncidentInclude;

const incidentDetailInclude = {
  ...incidentInclude,
  notes: {
    include: { author: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  alert: { select: { id: true, title: true, service: true } },
} satisfies Prisma.IncidentInclude;

export interface IncidentFilters {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  category?: IncidentCategory;
  shiftId?: string;
}

export interface CreateIncidentInput {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  relatedService?: string;
  assignedUserId?: string;
  shiftId?: string;
  source?: IncidentSource;
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  relatedService?: string;
  assignedUserId?: string | null;
  shiftId?: string | null;
}

export async function listIncidents(filters: IncidentFilters = {}) {
  const where: Prisma.IncidentWhereInput = {};

  if (filters.severity) where.severity = filters.severity;
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.shiftId) where.shiftId = filters.shiftId;

  return prisma.incident.findMany({
    where,
    include: incidentInclude,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getIncidentById(id: string) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: incidentDetailInclude,
  });

  if (!incident) throw new AppError(404, 'Incident not found');
  return incident;
}

export async function createIncident(input: CreateIncidentInput) {
  if (!input.title?.trim() || !input.description?.trim()) {
    throw new AppError(400, 'Title and description are required');
  }
  if (!input.category || !input.severity) {
    throw new AppError(400, 'Category and severity are required');
  }

  return prisma.incident.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      severity: input.severity,
      relatedService: input.relatedService,
      assignedUserId: input.assignedUserId,
      shiftId: input.shiftId,
      source: input.source ?? IncidentSource.MANUAL,
    },
    include: incidentInclude,
  });
}

export async function updateIncident(id: string, input: UpdateIncidentInput) {
  await getIncidentById(id);

  return prisma.incident.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.description && { description: input.description.trim() }),
      ...(input.category && { category: input.category }),
      ...(input.severity && { severity: input.severity }),
      ...(input.status && { status: input.status }),
      ...(input.relatedService !== undefined && { relatedService: input.relatedService }),
      ...(input.assignedUserId !== undefined && { assignedUserId: input.assignedUserId }),
      ...(input.shiftId !== undefined && { shiftId: input.shiftId }),
    },
    include: incidentInclude,
  });
}

export async function resolveIncident(id: string) {
  const incident = await getIncidentById(id);

  if (incident.status === IncidentStatus.CLOSED) {
    throw new AppError(400, 'Incident is already closed');
  }

  return prisma.incident.update({
    where: { id },
    data: {
      status: IncidentStatus.RESOLVED,
      resolvedAt: new Date(),
    },
    include: incidentInclude,
  });
}

export async function addIncidentNote(
  incidentId: string,
  authorId: string,
  content: string
) {
  if (!content?.trim()) {
    throw new AppError(400, 'Note content is required');
  }

  await getIncidentById(incidentId);

  const note = await prisma.incidentNote.create({
    data: {
      incidentId,
      authorId,
      content: content.trim(),
    },
    include: { author: { select: { id: true, fullName: true } } },
  });

  return getIncidentById(incidentId);
}
