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
import { DataCard, DataTable } from '../components/ui/DataCard';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
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
        title="Shift Handover"
        subtitle="Start, monitor, and complete operational shifts"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> New Shift
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {currentShift && (
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-blue-500 p-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={currentShift.responsible.fullName} size="lg" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Active Shift
              </p>
              <p className="font-semibold text-slate-900">
                {shiftTypeLabels[currentShift.shiftType]} —{' '}
                {formatShiftRange(currentShift.startTime, currentShift.endTime)}
              </p>
              <p className="text-sm text-slate-500">
                Operator: {currentShift.responsible.fullName}
              </p>
            </div>
          </div>
          <Link to={`/shifts/${currentShift.id}`}>
            <Button variant="secondary" size="sm">
              Open Handover
            </Button>
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
        <DataCard>
          <DataTable>
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Schedule</th>
                <th className="px-4 py-2.5">Operator</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Counts</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {shiftTypeLabels[shift.shiftType]}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <div>{formatShiftRange(shift.startTime, shift.endTime)}</div>
                    <div className="text-xs text-slate-400">{formatDate(shift.startTime)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={shift.responsible.fullName} size="sm" />
                      <span className="text-slate-600">{shift.responsible.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge
                      status={shift.status}
                      label={shiftStatusLabels[shift.status]}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {shift._count?.incidents ?? 0} inc / {shift._count?.tasks ?? 0} tasks
                  </td>
                  <td className="px-4 py-2.5">
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
          </DataTable>
        </DataCard>
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
          <Button type="submit" disabled={submitting || !form.responsibleId} className="w-full">
            {submitting ? 'Creating...' : 'Create Shift'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
