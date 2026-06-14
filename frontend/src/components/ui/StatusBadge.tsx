import { Badge } from './Badge';

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange'> = {
  PLANNED: 'info',
  ACTIVE: 'success',
  COMPLETED: 'default',
  OPEN: 'danger',
  INVESTIGATING: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
  IN_PROGRESS: 'warning',
  DONE: 'success',
  ACKNOWLEDGED: 'info',
  CONVERTED_TO_INCIDENT: 'success',
  DISMISSED: 'default',
  NEW: 'orange',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = statusVariants[status] ?? 'default';
  const display =
    label ??
    status
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');

  return <Badge variant={variant}>{display}</Badge>;
}
