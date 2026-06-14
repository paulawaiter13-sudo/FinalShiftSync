import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import * as incidentApi from '../services/incidentService';
import type { Incident, IncidentStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useUsers } from '../hooks/useUsers';
import { formatDate, formatRelative } from '../utils/format';
import { incidentCategoryLabels, incidentStatusLabels } from '../utils/labels';
import { ApiError } from '../services/api';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { users } = useUsers();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await incidentApi.getIncident(id);
      setIncident(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = async (data: Partial<Incident>) => {
    if (!id) return;
    try {
      await incidentApi.updateIncident(id, data);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    try {
      await incidentApi.resolveIncident(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resolve');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteText.trim()) return;
    setAddingNote(true);
    try {
      await incidentApi.addIncidentNote(id, noteText);
      setNoteText('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!incident) return <p className="text-slate-500">Incident not found</p>;

  const canResolve = !['RESOLVED', 'CLOSED'].includes(incident.status);

  return (
    <div>
      <Link
        to="/incidents"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to incidents
      </Link>

      <PageHeader
        title={incident.title}
        subtitle={incident.relatedService ?? incidentCategoryLabels[incident.category]}
        actions={
          canResolve ? (
            <button
              type="button"
              onClick={handleResolve}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4" /> Resolve
            </button>
          ) : null
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <SeverityBadge severity={incident.severity} />
        <StatusBadge status={incident.status} label={incidentStatusLabels[incident.status]} />
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {incident.source ?? 'MANUAL'}
        </span>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-2 font-semibold text-slate-900">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{incident.description}</p>
          <p className="mt-4 text-xs text-slate-400">
            Created {formatDate(incident.createdAt)} ({formatRelative(incident.createdAt)})
          </p>
          {incident.resolvedAt && (
            <p className="text-xs text-emerald-600">
              Resolved {formatDate(incident.resolvedAt)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <Select
              label="Status"
              value={incident.status}
              onChange={(v) => updateField({ status: v as IncidentStatus })}
              options={Object.entries(incidentStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <Select
              label="Assigned to"
              value={incident.assignedUserId ?? ''}
              onChange={(v) => updateField({ assignedUserId: v || null })}
              options={[
                { value: '', label: 'Unassigned' },
                ...users.map((u) => ({ value: u.id, label: u.fullName })),
              ]}
            />
          </div>
          {incident.shift && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Shift</p>
              <Link
                to={`/shifts/${incident.shift.id}`}
                className="mt-1 text-sm font-medium text-blue-600 hover:underline"
              >
                View linked shift
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Investigation Notes</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(incident.notes ?? []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">No notes yet</p>
          ) : (
            incident.notes?.map((note) => (
              <div key={note.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {note.author.fullName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatRelative(note.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{note.content}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleAddNote} className="border-t border-slate-100 p-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            placeholder="Add investigation note..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={addingNote || !noteText.trim()}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </button>
        </form>
      </div>
    </div>
  );
}
