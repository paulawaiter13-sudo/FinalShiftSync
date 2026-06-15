import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ListTodo,
  Users,
  Bot,
  Megaphone,
  ArrowRight,
  Clock,
  Radio,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardOverview } from '../services/dashboardService';
import type { DashboardOverview } from '../types';
import { KpiCard } from '../components/dashboard/KpiCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Badge } from '../components/ui/Badge';
import { SectionCard } from '../components/ui/SectionCard';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Button } from '../components/ui/Button';
import {
  formatShiftRange,
  getGreeting,
  getFirstName,
  formatRelative,
} from '../utils/format';
import { shiftStatusLabels } from '../utils/labels';
import { ApiError } from '../services/api';

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardOverview()
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const shiftRange = data.currentShift
    ? formatShiftRange(data.currentShift.startTime, data.currentShift.endTime)
    : 'No active shift';

  const summaryBullets = data.lastSummary
    ? data.lastSummary.generatedText
        .split('\n')
        .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .slice(0, 4)
        .map((line) => line.replace(/^[-•]\s*/, '').trim())
    : [];

  const topAnnouncement = data.importantAnnouncements[0];

  const nextShiftLabel = data.nextShift
    ? data.nextShift.responsible.fullName
        .split(' ')
        .map((n, i) => (i === 0 ? n[0] + '.' : n))
        .join(' ')
    : '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {getGreeting()}, {user ? getFirstName(user.fullName) : 'Operator'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Current Shift:{' '}
            <span className="font-semibold text-slate-800">{shiftRange}</span>
          </p>
          <p className="text-xs text-slate-400">Here is the overview of your shift.</p>
        </div>
        {data.currentShift && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-slate-700">{shiftRange}</span>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Open Incidents"
          value={data.stats.openIncidents}
          icon={AlertTriangle}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          subtitle={
            data.stats.criticalIncidents > 0 ? (
              <p className="flex items-center gap-1 text-xs font-semibold text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                {data.stats.criticalIncidents} Critical
              </p>
            ) : undefined
          }
        />
        <KpiCard
          title="Pending Tasks"
          value={data.stats.pendingTasks}
          icon={ListTodo}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard
          title="Active Alerts"
          value={data.stats.activeAlerts}
          icon={Radio}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KpiCard
          title="Next Shift"
          value={nextShiftLabel}
          icon={Users}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
          subtitle={
            data.nextShift ? (
              <div className="flex items-center gap-2">
                <UserAvatar name={data.nextShift.responsible.fullName} size="sm" />
                <p className="text-xs text-slate-500">
                  Starts at{' '}
                  {new Date(data.nextShift.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </p>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Smart Handover Summary" icon={Bot} iconColor="text-blue-600">
          {summaryBullets.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {summaryBullets.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No summary generated yet for recent shifts.</p>
          )}
          {data.lastSummary?.generatedByAI && (
            <Badge variant="info" className="mt-3">
              AI Generated
            </Badge>
          )}
          <Link
            to="/summaries"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Open Full Handover <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SectionCard>

        <SectionCard title="Manager Announcement" icon={Megaphone} iconColor="text-orange-500">
          {topAnnouncement ? (
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
                <Megaphone className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {topAnnouncement.priority === 'URGENT' && (
                    <Badge variant="orange">Urgent</Badge>
                  )}
                  <p className="font-semibold text-slate-800">{topAnnouncement.title}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {topAnnouncement.content}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  By {topAnnouncement.creator.fullName}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No important announcements.</p>
          )}
          <Link
            to="/announcements"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Read Announcement <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.currentShift && (
          <SectionCard
            title="Current Shift Activity"
            icon={CalendarClock}
            iconColor="text-emerald-600"
            action={
              <Badge variant="success">
                {shiftStatusLabels[data.currentShift.status]}
              </Badge>
            }
            noPadding
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <UserAvatar name={data.currentShift.responsible.fullName} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">
                  {data.currentShift.responsible.fullName}
                </p>
                <p className="text-xs text-slate-500">{shiftRange}</p>
                <p className="mt-0.5 text-xs font-medium text-emerald-600">
                  Status: {shiftStatusLabels[data.currentShift.status]}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <Link to={`/shifts/${data.currentShift.id}`}>
                <Button variant="secondary" size="sm">
                  Open Handover <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </SectionCard>
        )}

        {data.nextShift && (
          <SectionCard title="Next Shift" icon={Users} iconColor="text-blue-600" noPadding>
            <div className="flex items-center gap-3 px-4 py-3">
              <UserAvatar name={data.nextShift.responsible.fullName} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">
                  {data.nextShift.responsible.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatShiftRange(data.nextShift.startTime, data.nextShift.endTime)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Starts{' '}
                  {new Date(data.nextShift.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </p>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent Incidents" icon={AlertTriangle} iconColor="text-orange-500" noPadding>
          <div className="divide-y divide-slate-100">
            {data.recentIncidents.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No open incidents</p>
            ) : (
              data.recentIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{inc.title}</p>
                    <p className="text-xs text-slate-400">{formatRelative(inc.createdAt)}</p>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Monitoring Alerts"
          icon={Radio}
          iconColor="text-amber-600"
          action={
            <div className="flex items-center gap-2">
              <Badge variant="warning">{data.stats.activeAlerts} active</Badge>
              <Link to="/monitoring" className="text-xs font-medium text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          }
          noPadding
        >
          <div className="divide-y divide-slate-100">
            {data.recentAlerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No active alerts</p>
            ) : (
              data.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/80"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="truncate text-sm font-medium text-slate-800">{alert.title}</p>
                      <p className="text-xs text-slate-400">{alert.service}</p>
                    </div>
                  </div>
                  <SeverityBadge severity={alert.severity} />
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
