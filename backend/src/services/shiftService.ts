import { ShiftStatus, ShiftType, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';

const shiftInclude = {
  responsible: { select: { id: true, fullName: true, email: true } },
  _count: { select: { incidents: true, tasks: true, summaries: true } },
} satisfies Prisma.ShiftInclude;

const shiftDetailInclude = {
  responsible: { select: { id: true, fullName: true, email: true } },
  incidents: {
    include: {
      assignedUser: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  tasks: {
    include: {
      assignedUser: { select: { id: true, fullName: true } },
    },
    orderBy: { priority: 'desc' as const },
  },
  summaries: { orderBy: { generatedAt: 'desc' as const }, take: 5 },
  _count: { select: { incidents: true, tasks: true, alerts: true } },
} satisfies Prisma.ShiftInclude;

export interface ShiftFilters {
  status?: ShiftStatus;
}

export interface CreateShiftInput {
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  responsibleId: string;
  handoverNotes?: string;
}

export interface UpdateShiftInput {
  shiftType?: ShiftType;
  startTime?: string;
  endTime?: string;
  responsibleId?: string;
  handoverNotes?: string;
  status?: ShiftStatus;
}

export async function listShifts(filters: ShiftFilters = {}) {
  const where: Prisma.ShiftWhereInput = {};
  if (filters.status) where.status = filters.status;

  return prisma.shift.findMany({
    where,
    include: shiftInclude,
    orderBy: { startTime: 'desc' },
  });
}

export async function getCurrentShift() {
  return prisma.shift.findFirst({
    where: { status: ShiftStatus.ACTIVE },
    include: shiftDetailInclude,
    orderBy: { startTime: 'desc' },
  });
}

export async function getShiftById(id: string) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: shiftDetailInclude,
  });

  if (!shift) throw new AppError(404, 'Shift not found');
  return shift;
}

export async function createShift(input: CreateShiftInput) {
  if (!input.shiftType || !input.startTime || !input.endTime || !input.responsibleId) {
    throw new AppError(400, 'shiftType, startTime, endTime, and responsibleId are required');
  }

  const user = await prisma.user.findUnique({ where: { id: input.responsibleId } });
  if (!user) throw new AppError(400, 'Responsible user not found');

  return prisma.shift.create({
    data: {
      shiftType: input.shiftType,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      responsibleId: input.responsibleId,
      handoverNotes: input.handoverNotes,
      status: ShiftStatus.PLANNED,
    },
    include: shiftInclude,
  });
}

export async function updateShift(id: string, input: UpdateShiftInput) {
  await getShiftById(id);

  return prisma.shift.update({
    where: { id },
    data: {
      ...(input.shiftType && { shiftType: input.shiftType }),
      ...(input.startTime && { startTime: new Date(input.startTime) }),
      ...(input.endTime && { endTime: new Date(input.endTime) }),
      ...(input.responsibleId && { responsibleId: input.responsibleId }),
      ...(input.handoverNotes !== undefined && { handoverNotes: input.handoverNotes }),
      ...(input.status && { status: input.status }),
    },
    include: shiftInclude,
  });
}

export async function startShift(id: string) {
  const shift = await getShiftById(id);

  if (shift.status === ShiftStatus.ACTIVE) {
    throw new AppError(400, 'Shift is already active');
  }
  if (shift.status === ShiftStatus.COMPLETED) {
    throw new AppError(400, 'Cannot start a completed shift');
  }

  await prisma.$transaction([
    prisma.shift.updateMany({
      where: { status: ShiftStatus.ACTIVE },
      data: { status: ShiftStatus.COMPLETED },
    }),
    prisma.shift.update({
      where: { id },
      data: { status: ShiftStatus.ACTIVE },
    }),
  ]);

  return getShiftById(id);
}

export async function endShift(id: string, handoverNotes?: string) {
  const shift = await getShiftById(id);

  if (shift.status !== ShiftStatus.ACTIVE) {
    throw new AppError(400, 'Only active shifts can be ended');
  }

  return prisma.shift.update({
    where: { id },
    data: {
      status: ShiftStatus.COMPLETED,
      ...(handoverNotes !== undefined && { handoverNotes }),
    },
    include: shiftDetailInclude,
  });
}
