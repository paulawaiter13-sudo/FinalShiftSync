import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: ReactNode;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  subtitle,
}: KpiCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        <div className={`rounded-lg p-2 ${iconBg} ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
