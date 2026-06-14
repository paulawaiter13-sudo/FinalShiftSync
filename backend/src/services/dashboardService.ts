import {
  IncidentStatus,
  AlertStatus,
  TaskStatus,
  AnnouncementPriority,
} from '@prisma/client';
import { prisma } from '../prisma/client';

export async function getDashboardOverview() {
  const [
    currentShift,
    openIncidentsCount,
    activeAlertsCount,
    openTasksCount,
    lastSummary,
    recentIncidents,
    recentAlerts,
    importantAnnouncements,
    criticalIncidentsCount,
  ] = await Promise.all([
    prisma.shift.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        responsible: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.incident.count({
      where: { status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] } },
    }),
    prisma.alert.count({
      where: { status: { in: [AlertStatus.NEW, AlertStatus.ACKNOWLEDGED] } },
    }),
    prisma.task.count({
      where: { status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] } },
    }),
    prisma.shiftSummary.findFirst({
      orderBy: { generatedAt: 'desc' },
      include: {
        shift: {
          select: {
            id: true,
            shiftType: true,
            startTime: true,
            endTime: true,
            responsible: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.incident.findMany({
      where: { status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] } },
      include: {
        assignedUser: { select: { id: true, fullName: true } },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    }),
    prisma.alert.findMany({
      where: { status: { in: [AlertStatus.NEW, AlertStatus.ACKNOWLEDGED] } },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    }),
    prisma.announcement.findMany({
      where: {
        priority: { in: [AnnouncementPriority.IMPORTANT, AnnouncementPriority.URGENT] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { creator: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.incident.count({
      where: {
        severity: 'CRITICAL',
        status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] },
      },
    }),
  ]);

  const nextShift = await prisma.shift.findFirst({
    where: { status: 'PLANNED' },
    include: {
      responsible: { select: { id: true, fullName: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const pendingTasksCount = openTasksCount;

  return {
    currentShift,
    nextShift,
    stats: {
      openIncidents: openIncidentsCount,
      criticalIncidents: criticalIncidentsCount,
      activeAlerts: activeAlertsCount,
      openTasks: openTasksCount,
      pendingTasks: pendingTasksCount,
    },
    lastSummary,
    recentIncidents,
    recentAlerts,
    importantAnnouncements,
    shiftStatus: currentShift?.status ?? null,
  };
}
