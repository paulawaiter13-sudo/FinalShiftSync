import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SearchInput } from '../ui/SearchInput';
import { UserAvatar } from '../ui/UserAvatar';
import { useUnreadAnnouncements } from '../../hooks/useUnreadAnnouncements';

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useUnreadAnnouncements();

  const displayName = user
    ? `${user.fullName.split(' ')[0][0]}. ${user.fullName.split(' ').slice(-1)[0]}`
    : '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-slate-200/80 bg-white px-4 sm:px-5">
      <div className="hidden flex-1 max-w-lg sm:block">
        <SearchInput placeholder="Search incidents, shifts, and users..." />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 sm:flex-none sm:gap-2">
        <button
          type="button"
          onClick={() => navigate('/announcements')}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Announcements"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
          >
            {user && <UserAvatar name={user.fullName} size="sm" />}
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4" /> Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
