import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Square, Eye } from 'lucide-react';
import * as shiftApi from '../services/shiftService';
import type { Shift, ShiftStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CalendarClock } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { formatShiftRange, formatDate } from '../utils/format';
import { shiftTypeLabels, shiftStatusLabels } from '../utils/labels';
import { shiftTypeWithHours } from '../utils/shiftSchedule';
import { ApiError } from '../services/api';

export function ShiftsPage() {
  const { users } = useUsers();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    shiftType: 'MORNING',
    startTime: '',
    endTime: '',
    responsibleId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, current] = await Promise.all([
        shiftApi.getShifts(statusFilter ? (statusFilter as ShiftStatus) : undefined),
        shiftApi.getCurrentShift(),
      ]);
      setShifts(list);
      setCurrentShift(current);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await shiftApi.createShift({
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      setModalOpen(false);
      setForm({ shiftType: 'MORNING', startTime: '', endTime: '', responsibleId: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await shiftApi.startShift(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start shift');
    }
  };

  const handleEnd = async (id: string) => {
    const notes = window.prompt('Handover notes (optional):');
    try {
      await shiftApi.endShift(id, notes ?? undefined);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to end shift');
    }
  };

  return (
    <div>
      <PageHeader
        title="Shift Management"
        subtitle="Start, monitor, and complete operational shifts"
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Shift
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {currentShift && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <p className="text-sm font-medium text-blue-800">Active Shift</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {shiftTypeLabels[currentShift.shiftType]} —{' '}
            {formatShiftRange(currentShift.startTime, currentShift.endTime)}
          </p>
          <p className="text-sm text-slate-600">
            Operator: {currentShift.responsible.fullName}
          </p>
          <Link
            to={`/shifts/${currentShift.id}`}
            className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline"
          >
            View details →
          </Link>
        </div>
      )}

      <div className="mb-4 w-48">
        <Select
          label="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All statuses' },
            ...Object.entries(shiftStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : shifts.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No shifts found" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 font-medium text-slate-600">Schedule</th>
                <th className="px-4 py-3 font-medium text-slate-600">Operator</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">Counts</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {shiftTypeLabels[shift.shiftType]}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{formatShiftRange(shift.startTime, shift.endTime)}</div>
                    <div className="text-xs text-slate-400">{formatDate(shift.startTime)}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{shift.responsible.fullName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={shift.status}
                      label={shiftStatusLabels[shift.status]}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {shift._count?.incidents ?? 0} inc / {shift._count?.tasks ?? 0} tasks
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/shifts/${shift.id}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {shift.status === 'PLANNED' && (
                        <button
                          type="button"
                          onClick={() => handleStart(shift.id)}
                          className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                          title="Start shift"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {shift.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleEnd(shift.id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="End shift"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Shift" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Shift type"
            value={form.shiftType}
            onChange={(v) => setForm((f) => ({ ...f, shiftType: v }))}
            options={Object.entries(shiftTypeLabels).map(([value]) => ({
              value,
              label: shiftTypeWithHours(value, shiftTypeLabels),
            }))}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Start</label>
            <input
              type="datetime-local"
              required
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">End</label>
            <input
              type="datetime-local"
              required
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <Select
            label="Responsible operator"
            value={form.responsibleId}
            onChange={(v) => setForm((f) => ({ ...f, responsibleId: v }))}
            options={[
              { value: '', label: 'Select operator...' },
              ...users.map((u) => ({ value: u.id, label: u.fullName })),
            ]}
          />
          <button
            type="submit"
            disabled={submitting || !form.responsibleId}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Shift'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
