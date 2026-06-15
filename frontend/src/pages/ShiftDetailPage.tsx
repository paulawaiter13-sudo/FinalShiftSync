import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Square,
  Save,
  Sparkles,
  ListTodo,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import * as shiftApi from '../services/shiftService';
import type { Shift } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Badge } from '../components/ui/Badge';
import { SectionCard } from '../components/ui/SectionCard';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatShiftRange, formatDate, formatRelative } from '../utils/format';
import { shiftTypeLabels, shiftStatusLabels, taskPriorityLabels } from '../utils/labels';
import { ApiError } from '../services/api';
import * as summaryApi from '../services/summaryService';
import { SummaryCard } from '../components/summary/SummaryCard';
import type { ShiftSummary } from '../types';

export function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [summaries, setSummaries] = useState<ShiftSummary[]>([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [data, shiftSummaries] = await Promise.all([
        shiftApi.getShift(id),
        summaryApi.getShiftSummaries(id),
      ]);
      setShift(data);
      setSummaries(shiftSummaries);
      setNotes(data.handoverNotes ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load shift');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNotes = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await shiftApi.updateShift(id, { handoverNotes: notes });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      await shiftApi.startShift(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start');
    }
  };

  const handleEnd = async () => {
    if (!id) return;
    try {
      await shiftApi.endShift(id, notes);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to end shift');
    }
  };

  const handleGenerateSummary = async () => {
    if (!id) return;
    setGeneratingSummary(true);
    setError('');
    try {
      const created = await summaryApi.generateSummary(id);
      setSummaries((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!shift) {
    return <p className="text-slate-500">Shift not found</p>;
  }

  const openIncidents = (shift.incidents ?? []).filter(
    (i) => !['RESOLVED', 'CLOSED'].includes(i.status)
  );
  const pendingTasks = (shift.tasks ?? []).filter((t) => t.status !== 'DONE');

  return (
    <div>
      <Link
        to="/shifts"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shifts
      </Link>

      <PageHeader
        title="Shift Handover"
        subtitle={`${shiftTypeLabels[shift.shiftType]} · ${formatShiftRange(shift.startTime, shift.endTime)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/shifts">
              <Button variant="secondary" size="sm">
                Previous Handovers
              </Button>
            </Link>
            {shift.status === 'PLANNED' && (
              <Button variant="success" size="sm" onClick={handleStart}>
                <Play className="h-4 w-4" /> Start Shift
              </Button>
            )}
            {shift.status === 'ACTIVE' && (
              <Button variant="danger" size="sm" onClick={handleEnd}>
                <Square className="h-4 w-4" /> Complete Handover
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="card flex items-center gap-3 p-3">
          <UserAvatar name={shift.responsible.fullName} />
          <div>
            <p className="text-xs text-slate-500">Operator</p>
            <p className="text-sm font-semibold text-slate-900">{shift.responsible.fullName}</p>
          </div>
        </div>
        <div className="card p-3">
          <p className="text-xs text-slate-500">Status</p>
          <div className="mt-1">
            <StatusBadge status={shift.status} label={shiftStatusLabels[shift.status]} />
          </div>
        </div>
        <div className="card p-3">
          <p className="text-xs text-slate-500">Open Incidents</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{openIncidents.length}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-slate-500">Pending Tasks</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{pendingTasks.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Follow-up Items"
          icon={AlertTriangle}
          iconColor="text-orange-500"
          noPadding
        >
          <div className="divide-y divide-slate-100">
            {openIncidents.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-400">No open incidents</p>
            ) : (
              openIncidents.map((inc) => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{inc.title}</p>
                      <p className="text-xs text-slate-400">{formatRelative(inc.createdAt)}</p>
                    </div>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </Link>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Pending Tasks" icon={ListTodo} iconColor="text-blue-600" noPadding>
          <div className="divide-y divide-slate-100">
            {pendingTasks.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-400">No pending tasks</p>
            ) : (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-400">
                        {task.assignedUser?.fullName ?? 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'HIGH'
                        ? 'danger'
                        : task.priority === 'MEDIUM'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {taskPriorityLabels[task.priority]}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Shift Notes" icon={Save} iconColor="text-slate-600">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Document issues, follow-ups, and context for the next shift..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" size="sm" onClick={saveNotes} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Handover Checklist"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        >
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              {openIncidents.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              All critical incidents reviewed ({openIncidents.length} open)
            </li>
            <li className="flex items-center gap-2">
              {pendingTasks.length === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              Pending tasks documented ({pendingTasks.length} remaining)
            </li>
            <li className="flex items-center gap-2">
              {notes.trim() ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              Handover notes completed
            </li>
            <li className="flex items-center gap-2">
              {summaries.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              AI summary generated
            </li>
          </ul>
          {shift.createdAt && (
            <p className="mt-3 text-xs text-slate-400">Shift created {formatDate(shift.createdAt)}</p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">AI Shift Summaries</h2>
          <Button onClick={handleGenerateSummary} disabled={generatingSummary} size="sm">
            <Sparkles className="h-4 w-4" />
            {generatingSummary ? 'Generating...' : 'Generate AI Summary'}
          </Button>
        </div>
        {summaries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No AI summary yet. Generate one from shift data before handover.
          </p>
        ) : (
          <div className="space-y-3">
            {summaries.map((summary, i) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                onUpdate={(updated) =>
                  setSummaries((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                  )
                }
                defaultExpanded={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
