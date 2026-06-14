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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardOverview } from '../services/dashboardService';
import type { DashboardOverview } from '../types';
import { KpiCard } from '../components/dashboard/KpiCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Badge } from '../components/ui/Badge';
import {
  formatShiftRange,
  getGreeting,
  getFirstName,
  formatRelative,
} from '../utils/format';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user ? getFirstName(user.fullName) : 'Operator'} 👋
          </h1>
          <p className="mt-1 text-slate-500">
            Current Shift: <span className="font-medium text-slate-700">{shiftRange}</span>
          </p>
          <p className="text-sm text-slate-400">Here is the overview of your shift.</p>
        </div>
        {data.currentShift && (
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <Clock className="h-4 w-4" />
            {shiftRange}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Open Incidents"
          value={data.stats.openIncidents}
          icon={AlertTriangle}
          iconColor="text-orange-500"
          subtitle={
            data.stats.criticalIncidents > 0 ? (
              <p className="text-sm font-medium text-red-600">
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
        />
        <KpiCard
          title="Next Shift"
          value={
            data.nextShift
              ? data.nextShift.responsible.fullName.split(' ').map((n, i) =>
                  i === 0 ? n[0] + '.' : n
                ).join(' ')
              : '—'
          }
          icon={Users}
          iconColor="text-slate-500"
          subtitle={
            data.nextShift ? (
              <p className="text-sm text-slate-500">
                Starts at {new Date(data.nextShift.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            ) : undefined
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Smart Handover Summary</h2>
            {data.lastSummary?.generatedByAI && (
              <Badge variant="info">AI</Badge>
            )}
          </div>
          {summaryBullets.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {summaryBullets.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No summary generated yet for recent shifts.</p>
          )}
          <Link
            to="/summaries"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Open Full Handover <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-500" />
            <h2 className="font-semibold text-slate-900">Manager Announcement</h2>
          </div>
          {topAnnouncement ? (
            <>
              <div className="flex items-start gap-2">
                {topAnnouncement.priority === 'URGENT' && (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                )}
                <p className="font-medium text-slate-800">{topAnnouncement.title}</p>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {topAnnouncement.content}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No important announcements.</p>
          )}
          <Link
            to="/announcements"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Read Announcement <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent Incidents</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentIncidents.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No open incidents</p>
            ) : (
              data.recentIncidents.map((inc) => (
                <div key={inc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{inc.title}</p>
                    <p className="text-xs text-slate-400">{formatRelative(inc.createdAt)}</p>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Monitoring Alerts</h2>
            <div className="flex items-center gap-2">
              <Badge variant="warning">{data.stats.activeAlerts} active</Badge>
              <Link to="/monitoring" className="text-xs font-medium text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentAlerts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No active alerts</p>
            ) : (
              data.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <Radio className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
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
        </div>
      </div>

      {data.currentShift && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-5 py-3 text-sm">
          <span className="font-medium text-emerald-800">Shift Status: </span>
          <span className="text-emerald-700 capitalize">{data.currentShift.status.toLowerCase()}</span>
          <span className="text-emerald-600">
            {' '}
            — Operator: {data.currentShift.responsible.fullName}
          </span>
        </div>
      )}
    </div>
  );
}
