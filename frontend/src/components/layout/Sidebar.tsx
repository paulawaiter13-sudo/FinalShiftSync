import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  AlertTriangle,
  Radio,
  ListTodo,
  Sparkles,
  Megaphone,
  Settings,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/shifts', label: 'Shifts', icon: CalendarClock },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/monitoring', label: 'Monitoring', icon: Radio },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/summaries', label: 'AI Summaries', icon: Sparkles },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-white transition-transform duration-200 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
            S
          </div>
          <span className="text-lg font-semibold tracking-tight">ShiftSync</span>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">
        NOC Operations Platform v1.0
      </div>
    </aside>
  );
}
