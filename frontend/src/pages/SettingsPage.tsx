import { useEffect, useState } from 'react';
import { Users, Shield } from 'lucide-react';
import { getUsers } from '../services/userService';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataTable } from '../components/ui/DataCard';
import { UserAvatar } from '../components/ui/UserAvatar';
import { SectionCard } from '../components/ui/SectionCard';
import { AppLogo } from '../components/ui/AppLogo';
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

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="card flex items-center gap-3 p-4">
          <AppLogo variant="full" size="sm" />
          <div>
            <p className="font-semibold text-slate-900">ShiftSync v1.0</p>
            <p className="text-sm text-slate-500">NOC Handover Platform</p>
          </div>
        </div>
        {currentUser && (
          <div className="card flex items-center gap-3 p-4">
            <UserAvatar name={currentUser.fullName} size="lg" />
            <div>
              <p className="text-xs font-medium text-slate-500">Signed in as</p>
              <p className="font-semibold text-slate-900">{currentUser.fullName}</p>
              <Badge variant={roleBadgeVariant(currentUser.role)} className="mt-1">
                {userRoleLabels[currentUser.role]}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <SectionCard title="Team Members" icon={Users} iconColor="text-slate-500" noPadding>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable>
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={
                    u.id === currentUser?.id ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                  }
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={u.fullName} size="sm" />
                      <span className="font-medium text-slate-800">
                        {u.fullName}
                        {u.id === currentUser?.id && (
                          <span className="ml-1.5 text-xs text-blue-600">(you)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                      <Badge variant={roleBadgeVariant(u.role)}>
                        {userRoleLabels[u.role]}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </SectionCard>
    </div>
  );
}
