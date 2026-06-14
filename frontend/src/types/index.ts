export type UserRole = 'OPERATOR' | 'SHIFT_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ShiftUser {
  id: string;
  fullName: string;
  email?: string;
}

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';
export type ShiftStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface Shift {
  id: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  handoverNotes?: string | null;
  responsibleId?: string;
  responsible: ShiftUser;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    incidents: number;
    tasks: number;
    summaries?: number;
    alerts?: number;
  };
  incidents?: Incident[];
  tasks?: Task[];
  summaries?: ShiftSummaryBrief[];
}

export interface ShiftSummaryBrief {
  id: string;
  generatedText: string;
  generatedAt: string;
  generatedByAI: boolean;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type IncidentCategory =
  | 'INFRASTRUCTURE'
  | 'APPLICATION'
  | 'SECURITY'
  | 'NETWORK'
  | 'DATABASE'
  | 'OTHER';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  relatedService?: string | null;
  source?: string;
  assignedUserId?: string | null;
  shiftId?: string | null;
  assignedUser?: { id: string; fullName: string; email?: string } | null;
  shift?: { id: string; shiftType: string; startTime: string; endTime: string } | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  notes?: IncidentNote[];
  alert?: { id: string; title: string; service: string } | null;
}

export interface IncidentNote {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; fullName: string };
}

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserId?: string | null;
  shiftId?: string | null;
  dueDate?: string | null;
  assignedUser?: { id: string; fullName: string } | null;
  shift?: { id: string; shiftType: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'CONVERTED_TO_INCIDENT'
  | 'DISMISSED';

export interface Alert {
  id: string;
  title: string;
  description: string;
  service: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sourceSystem: string;
  shiftId?: string | null;
  incidentId?: string | null;
  createdAt: string;
  shift?: { id: string; shiftType: string } | null;
  incident?: { id: string; title: string; status: string } | null;
}

export interface ConvertAlertResult {
  alert: Alert;
  incident: Incident;
}

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  createdAt: string;
  expiresAt?: string | null;
  createdBy?: string;
  creator: {
    id?: string;
    fullName: string;
    email?: string;
    role?: UserRole;
  };
}

export interface ShiftSummary {
  id: string;
  generatedText: string;
  generatedAt: string;
  generatedByAI: boolean;
  shift: {
    id: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    responsible: { fullName: string };
  };
}

export interface DashboardOverview {
  currentShift: Shift | null;
  nextShift: Shift | null;
  stats: {
    openIncidents: number;
    criticalIncidents: number;
    activeAlerts: number;
    openTasks: number;
    pendingTasks: number;
  };
  lastSummary: ShiftSummary | null;
  recentIncidents: Incident[];
  recentAlerts: Alert[];
  importantAnnouncements: Announcement[];
  shiftStatus: string | null;
}
