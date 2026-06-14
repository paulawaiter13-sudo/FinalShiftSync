import {
  AlertSeverity,
  AlertStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';
import {
  alertSeverityToIncidentSeverity,
  generateMockAlerts,
  inferCategoryFromService,
} from './monitoringSimulator';

const alertInclude = {
  shift: { select: { id: true, shiftType: true } },
  incident: { select: { id: true, title: true, status: true } },
} satisfies Prisma.AlertInclude;

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  service?: string;
}

export async function listAlerts(filters: AlertFilters = {}) {
  const where: Prisma.AlertWhereInput = {};

  if (filters.severity) where.severity = filters.severity;
  if (filters.status) where.status = filters.status;
  if (filters.service) {
    where.service = { contains: filters.service, mode: 'insensitive' };
  }

  return prisma.alert.findMany({
    where,
    include: alertInclude,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getAlertById(id: string) {
  const alert = await prisma.alert.findUnique({
    where: { id },
    include: alertInclude,
  });

  if (!alert) throw new AppError(404, 'Alert not found');
  return alert;
}

export async function generateAlerts(count = 1) {
  const quantity = Math.min(Math.max(count, 1), 5);
  const templates = generateMockAlerts(quantity);

  const activeShift = await prisma.shift.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  const created = await Promise.all(
    templates.map((template) =>
      prisma.alert.create({
        data: {
          ...template,
          shiftId: activeShift?.id,
          status: AlertStatus.NEW,
        },
        include: alertInclude,
      })
    )
  );

  return created;
}

export async function acknowledgeAlert(id: string) {
  const alert = await getAlertById(id);

  if (alert.status === AlertStatus.CONVERTED_TO_INCIDENT) {
    throw new AppError(400, 'Alert already converted to incident');
  }
  if (alert.status === AlertStatus.DISMISSED) {
    throw new AppError(400, 'Cannot acknowledge a dismissed alert');
  }

  return prisma.alert.update({
    where: { id },
    data: { status: AlertStatus.ACKNOWLEDGED },
    include: alertInclude,
  });
}

export async function dismissAlert(id: string) {
  const alert = await getAlertById(id);

  if (alert.status === AlertStatus.CONVERTED_TO_INCIDENT) {
    throw new AppError(400, 'Cannot dismiss an alert converted to incident');
  }

  return prisma.alert.update({
    where: { id },
    data: { status: AlertStatus.DISMISSED },
    include: alertInclude,
  });
}

export interface ConvertAlertInput {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  assignedUserId?: string;
}

export async function convertAlertToIncident(id: string, input: ConvertAlertInput = {}) {
  const alert = await getAlertById(id);

  if (alert.status === AlertStatus.CONVERTED_TO_INCIDENT) {
    throw new AppError(400, 'Alert already converted to incident');
  }
  if (alert.incidentId) {
    throw new AppError(400, 'Alert is already linked to an incident');
  }

  const category =
    input.category ??
    (inferCategoryFromService(alert.service) as IncidentCategory);

  const severity =
    input.severity ?? alertSeverityToIncidentSeverity(alert.severity);

  const result = await prisma.$transaction(async (tx) => {
    const incident = await tx.incident.create({
      data: {
        title: input.title?.trim() || alert.title,
        description:
          input.description?.trim() ||
          `${alert.description}\n\n---\nConverted from monitoring alert (${alert.sourceSystem}).`,
        category,
        severity,
        status: IncidentStatus.OPEN,
        relatedService: alert.service,
        assignedUserId: input.assignedUserId,
        shiftId: alert.shiftId,
        source: IncidentSource.MONITORING,
      },
      include: {
        assignedUser: { select: { id: true, fullName: true } },
      },
    });

    const updatedAlert = await tx.alert.update({
      where: { id },
      data: {
        status: AlertStatus.CONVERTED_TO_INCIDENT,
        incidentId: incident.id,
      },
      include: alertInclude,
    });

    return { alert: updatedAlert, incident };
  });

  return result;
}
