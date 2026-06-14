import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: ReactNode;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  subtitle,
}: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
        </div>
        <div className={`rounded-lg bg-slate-50 p-2.5 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
