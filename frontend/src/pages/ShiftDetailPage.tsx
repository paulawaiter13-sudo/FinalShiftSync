import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Square, Save, Sparkles } from 'lucide-react';
import * as shiftApi from '../services/shiftService';
import type { Shift } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Badge } from '../components/ui/Badge';
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

  return (
    <div>
      <Link
        to="/shifts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shifts
      </Link>

      <PageHeader
        title={`${shiftTypeLabels[shift.shiftType]} Shift`}
        subtitle={formatShiftRange(shift.startTime, shift.endTime)}
        actions={
          <div className="flex gap-2">
            {shift.status === 'PLANNED' && (
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Play className="h-4 w-4" /> Start Shift
              </button>
            )}
            {shift.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={handleEnd}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Square className="h-4 w-4" /> End Shift
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Status</p>
          <div className="mt-2">
            <StatusBadge status={shift.status} label={shiftStatusLabels[shift.status]} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Operator</p>
          <p className="mt-2 font-semibold text-slate-900">{shift.responsible.fullName}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Created</p>
          <p className="mt-2 text-slate-700">
            {shift.createdAt ? formatDate(shift.createdAt) : '—'}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Handover Notes</h2>
          <button
            type="button"
            onClick={saveNotes}
            disabled={saving}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Document issues, follow-ups, and context for the next shift..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Incidents ({shift.incidents?.length ?? 0})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(shift.incidents ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">No incidents for this shift</p>
            ) : (
              shift.incidents?.map((inc) => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{inc.title}</p>
                    <p className="text-xs text-slate-400">{formatRelative(inc.createdAt)}</p>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Tasks ({shift.tasks?.length ?? 0})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(shift.tasks ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400">No tasks for this shift</p>
            ) : (
              shift.tasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {task.assignedUser?.fullName ?? 'Unassigned'}
                    </p>
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
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">AI Shift Summaries</h2>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {generatingSummary ? 'Generating...' : 'Generate AI Summary'}
          </button>
        </div>
        {summaries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
            No AI summary yet. Generate one from shift data before handover.
          </p>
        ) : (
          <div className="space-y-4">
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
