export const shiftTypeLabels: Record<string, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  NIGHT: 'Night',
};

export const shiftStatusLabels: Record<string, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

export const incidentCategoryLabels: Record<string, string> = {
  INFRASTRUCTURE: 'Infrastructure',
  APPLICATION: 'Application',
  SECURITY: 'Security',
  NETWORK: 'Network',
  DATABASE: 'Database',
  OTHER: 'Other',
};

export const incidentStatusLabels: Record<string, string> = {
  OPEN: 'Open',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const taskStatusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const taskPriorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const alertStatusLabels: Record<string, string> = {
  NEW: 'New',
  ACKNOWLEDGED: 'Acknowledged',
  CONVERTED_TO_INCIDENT: 'Converted',
  DISMISSED: 'Dismissed',
};

export const announcementPriorityLabels: Record<string, string> = {
  NORMAL: 'Normal',
  IMPORTANT: 'Important',
  URGENT: 'Urgent',
};

export const userRoleLabels: Record<string, string> = {
  OPERATOR: 'NOC Operator',
  SHIFT_MANAGER: 'Shift Manager',
  ADMIN: 'Administrator',
};
