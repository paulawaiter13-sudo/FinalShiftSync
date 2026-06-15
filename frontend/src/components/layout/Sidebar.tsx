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
import { useUnreadAnnouncements } from '../../hooks/useUnreadAnnouncements';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/shifts', label: 'Shift Handover', icon: CalendarClock },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/monitoring', label: 'Monitoring', icon: Radio },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/summaries', label: 'AI Summaries', icon: Sparkles },
  { to: '/announcements', label: 'Announcements', icon: Megaphone, notify: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  const { unreadCount } = useUnreadAnnouncements();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-white transition-transform duration-200 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 font-bold text-sm text-white shadow-sm">
            S
          </div>
          <span className="text-base font-semibold tracking-tight">ShiftSync</span>
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

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map(({ to, label, icon: Icon, end, notify }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/90 text-white'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-blue-400" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {notify && unreadCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-orange-400" aria-label={`${unreadCount} unread`} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-400">
        NOC Operations Platform v1.0
      </div>
    </aside>
  );
}
