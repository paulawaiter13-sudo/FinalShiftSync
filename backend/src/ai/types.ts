export interface ShiftSummaryContext {
  shift: {
    id: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    status: string;
    operatorName: string;
    handoverNotes: string | null;
  };
  incidents: {
    critical: Array<{ title: string; severity: string; status: string; service?: string }>;
    open: Array<{ title: string; severity: string; status: string; service?: string }>;
    resolved: Array<{ title: string; severity: string; service?: string }>;
  };
  alerts: Array<{ title: string; severity: string; status: string; service: string }>;
  tasks: {
    pending: Array<{ title: string; priority: string; status: string; assignee?: string }>;
    completed: Array<{ title: string; priority: string }>;
  };
}

export interface AIProvider {
  readonly name: string;
  generateShiftSummary(context: ShiftSummaryContext): Promise<string>;
}
