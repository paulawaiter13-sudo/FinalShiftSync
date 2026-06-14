import { Badge } from './Badge';

const severityMap = {
  CRITICAL: { label: 'Critical', variant: 'danger' as const },
  HIGH: { label: 'High', variant: 'danger' as const },
  MEDIUM: { label: 'Medium', variant: 'warning' as const },
  LOW: { label: 'Low', variant: 'success' as const },
  WARNING: { label: 'Warning', variant: 'warning' as const },
  INFO: { label: 'Info', variant: 'info' as const },
};

interface SeverityBadgeProps {
  severity: keyof typeof severityMap;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityMap[severity] ?? { label: severity, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
