import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import * as incidentApi from '../services/incidentService';
import * as shiftApi from '../services/shiftService';
import type {
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertTriangle } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { formatRelative } from '../utils/format';
import {
  incidentCategoryLabels,
  incidentStatusLabels,
} from '../utils/labels';
import { ApiError } from '../services/api';

export function IncidentsPage() {
  const { users } = useUsers();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState<string | undefined>();

  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    category: '',
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'APPLICATION' as IncidentCategory,
    severity: 'MEDIUM' as IncidentSeverity,
    relatedService: '',
    assignedUserId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, current] = await Promise.all([
        incidentApi.getIncidents({
          severity: filters.severity as IncidentSeverity | undefined,
          status: filters.status as IncidentStatus | undefined,
          category: filters.category as IncidentCategory | undefined,
        }),
        shiftApi.getCurrentShift(),
      ]);
      setIncidents(list);
      setCurrentShiftId(current?.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await incidentApi.createIncident({
        ...form,
        assignedUserId: form.assignedUserId || undefined,
        relatedService: form.relatedService || undefined,
        shiftId: currentShiftId,
      });
      setModalOpen(false);
      setForm({
        title: '',
        description: '',
        category: 'APPLICATION',
        severity: 'MEDIUM',
        relatedService: '',
        assignedUserId: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Incident Management"
        subtitle="Track, investigate, and resolve operational incidents"
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Incident
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select
          label="Severity"
          value={filters.severity}
          onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
          options={[
            { value: '', label: 'All severities' },
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ]}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          options={[
            { value: '', label: 'All statuses' },
            ...Object.entries(incidentStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <Select
          label="Category"
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
          options={[
            { value: '', label: 'All categories' },
            ...Object.entries(incidentCategoryLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : incidents.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No incidents match your filters" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="px-4 py-3 font-medium text-slate-600">Severity</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">Assigned</th>
                <th className="px-4 py-3 font-medium text-slate-600">Created</th>
                <th className="px-4 py-3 font-medium text-slate-600" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{inc.title}</p>
                    {inc.relatedService && (
                      <p className="text-xs text-slate-400">{inc.relatedService}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {incidentCategoryLabels[inc.category]}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={inc.status}
                      label={incidentStatusLabels[inc.status]}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {inc.assignedUser?.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatRelative(inc.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Incident" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={form.category}
              onChange={(v) =>
                setForm((f) => ({ ...f, category: v as IncidentCategory }))
              }
              options={Object.entries(incidentCategoryLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Select
              label="Severity"
              value={form.severity}
              onChange={(v) =>
                setForm((f) => ({ ...f, severity: v as IncidentSeverity }))
              }
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Related service
            </label>
            <input
              value={form.relatedService}
              onChange={(e) => setForm((f) => ({ ...f, relatedService: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="e.g. payment-service"
            />
          </div>
          <Select
            label="Assign to"
            value={form.assignedUserId}
            onChange={(v) => setForm((f) => ({ ...f, assignedUserId: v }))}
            options={[
              { value: '', label: 'Unassigned' },
              ...users.map((u) => ({ value: u.id, label: u.fullName })),
            ]}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Incident'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
