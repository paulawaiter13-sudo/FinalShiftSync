import { useEffect, useState } from 'react';
import { Settings, Users, Shield } from 'lucide-react';
import { getUsers } from '../services/userService';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { userRoleLabels } from '../utils/labels';
import { formatDate } from '../utils/format';
import { ApiError } from '../services/api';

function roleBadgeVariant(role: string) {
  if (role === 'ADMIN') return 'danger' as const;
  if (role === 'SHIFT_MANAGER') return 'warning' as const;
  return 'info' as const;
}

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load users')
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Users and platform configuration"
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">ShiftSync v1.0</p>
              <p className="text-sm text-slate-500">NOC Handover Platform</p>
            </div>
          </div>
        </div>
        {currentUser && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Signed in as</p>
            <p className="mt-1 font-semibold text-slate-900">{currentUser.fullName}</p>
            <Badge variant={roleBadgeVariant(currentUser.role)} className="mt-2">
              {userRoleLabels[currentUser.role]}
            </Badge>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Users className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Team Members</h2>
          <span className="text-sm text-slate-400">({users.length})</span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 font-medium text-slate-600">Name</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Email</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Role</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={
                      u.id === currentUser?.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                    }
                  >
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {u.fullName}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-blue-600">(you)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                        <Badge variant={roleBadgeVariant(u.role)}>
                          {userRoleLabels[u.role]}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
