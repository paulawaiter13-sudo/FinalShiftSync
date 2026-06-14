import { TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/errors';

const taskInclude = {
  assignedUser: { select: { id: true, fullName: true, email: true } },
  shift: {
    select: { id: true, shiftType: true, startTime: true, endTime: true },
  },
} satisfies Prisma.TaskInclude;

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  shiftId?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedUserId?: string;
  shiftId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string | null;
  shiftId?: string | null;
  dueDate?: string | null;
}

export async function listTasks(filters: TaskFilters = {}) {
  const where: Prisma.TaskWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.shiftId) where.shiftId = filters.shiftId;

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });

  if (!task) throw new AppError(404, 'Task not found');
  return task;
}

export async function createTask(input: CreateTaskInput) {
  if (!input.title?.trim()) {
    throw new AppError(400, 'Title is required');
  }

  return prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description,
      priority: input.priority ?? TaskPriority.MEDIUM,
      assignedUserId: input.assignedUserId,
      shiftId: input.shiftId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
    include: taskInclude,
  });
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  await getTaskById(id);

  return prisma.task.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title.trim() }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status && { status: input.status }),
      ...(input.priority && { priority: input.priority }),
      ...(input.assignedUserId !== undefined && { assignedUserId: input.assignedUserId }),
      ...(input.shiftId !== undefined && { shiftId: input.shiftId }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
    },
    include: taskInclude,
  });
}

export async function deleteTask(id: string) {
  await getTaskById(id);
  await prisma.task.delete({ where: { id } });
}
