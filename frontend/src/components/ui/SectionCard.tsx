import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  action,
  children,
  collapsible = false,
  defaultOpen = true,
  className = '',
  noPadding = false,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />}
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={open ? 'Collapse section' : 'Expand section'}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
              />
            </button>
          )}
        </div>
      </div>
      {(!collapsible || open) && (
        <div className={noPadding ? '' : 'p-4'}>{children}</div>
      )}
    </div>
  );
}
