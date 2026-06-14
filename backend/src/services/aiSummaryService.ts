import { IncidentStatus, TaskStatus } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';
import { getAIProvider } from '../ai';
import { ShiftSummaryContext } from '../ai/types';

const summaryInclude = {
  shift: {
    select: {
      id: true,
      shiftType: true,
      startTime: true,
      endTime: true,
      status: true,
      responsible: { select: { fullName: true } },
    },
  },
};

async function buildShiftContext(shiftId: string): Promise<ShiftSummaryContext> {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      responsible: { select: { fullName: true } },
      incidents: {
        include: { assignedUser: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      tasks: {
        include: { assignedUser: { select: { fullName: true } } },
        orderBy: { priority: 'desc' },
      },
      alerts: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!shift) throw new AppError(404, 'Shift not found');

  const openStatuses: IncidentStatus[] = [
    IncidentStatus.OPEN,
    IncidentStatus.INVESTIGATING,
  ];

  const critical = shift.incidents.filter((i) => i.severity === 'CRITICAL');
  const open = shift.incidents.filter((i) => openStatuses.includes(i.status));
  const resolved = shift.incidents.filter(
    (i) => i.status === IncidentStatus.RESOLVED || i.status === IncidentStatus.CLOSED
  );

  const pendingTasks = shift.tasks.filter(
    (t) => t.status === TaskStatus.OPEN || t.status === TaskStatus.IN_PROGRESS
  );
  const completedTasks = shift.tasks.filter((t) => t.status === TaskStatus.DONE);

  return {
    shift: {
      id: shift.id,
      shiftType: shift.shiftType,
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      status: shift.status,
      operatorName: shift.responsible.fullName,
      handoverNotes: shift.handoverNotes,
    },
    incidents: {
      critical: critical.map((i) => ({
        title: i.title,
        severity: i.severity,
        status: i.status,
        service: i.relatedService ?? undefined,
      })),
      open: open.map((i) => ({
        title: i.title,
        severity: i.severity,
        status: i.status,
        service: i.relatedService ?? undefined,
      })),
      resolved: resolved.map((i) => ({
        title: i.title,
        severity: i.severity,
        service: i.relatedService ?? undefined,
      })),
    },
    alerts: shift.alerts.map((a) => ({
      title: a.title,
      severity: a.severity,
      status: a.status,
      service: a.service,
    })),
    tasks: {
      pending: pendingTasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignee: t.assignedUser?.fullName,
      })),
      completed: completedTasks.map((t) => ({
        title: t.title,
        priority: t.priority,
      })),
    },
  };
}

export async function listSummaries() {
  return prisma.shiftSummary.findMany({
    include: summaryInclude,
    orderBy: { generatedAt: 'desc' },
  });
}

export async function getSummariesForShift(shiftId: string) {
  await buildShiftContext(shiftId);

  return prisma.shiftSummary.findMany({
    where: { shiftId },
    include: summaryInclude,
    orderBy: { generatedAt: 'desc' },
  });
}

export async function getSummaryById(id: string) {
  const summary = await prisma.shiftSummary.findUnique({
    where: { id },
    include: summaryInclude,
  });

  if (!summary) throw new AppError(404, 'Summary not found');
  return summary;
}

export async function generateSummaryForShift(shiftId: string) {
  const context = await buildShiftContext(shiftId);
  const provider = getAIProvider();
  const generatedText = await provider.generateShiftSummary(context);

  return prisma.shiftSummary.create({
    data: {
      shiftId,
      generatedText,
      generatedByAI: true,
    },
    include: summaryInclude,
  });
}

export async function updateSummary(id: string, generatedText: string) {
  if (!generatedText?.trim()) {
    throw new AppError(400, 'Summary text is required');
  }

  await getSummaryById(id);

  return prisma.shiftSummary.update({
    where: { id },
    data: { generatedText: generatedText.trim() },
    include: summaryInclude,
  });
}
