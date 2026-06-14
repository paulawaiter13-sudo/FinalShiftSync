import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radio,
  Zap,
  Check,
  X,
  ArrowRightLeft,
  ExternalLink,
} from 'lucide-react';
import * as alertApi from '../services/alertService';
import type { Alert, AlertSeverity, AlertStatus, IncidentCategory, IncidentSeverity } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useUsers } from '../hooks/useUsers';
import { formatRelative } from '../utils/format';
import { alertStatusLabels, incidentCategoryLabels } from '../utils/labels';
import { ApiError } from '../services/api';

export function MonitoringPage() {
  const navigate = useNavigate();
  const { users } = useUsers();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [convertModal, setConvertModal] = useState<Alert | null>(null);
  const [converting, setConverting] = useState(false);

  const [filters, setFilters] = useState({
    severity: '',
    status: '',
  });

  const [convertForm, setConvertForm] = useState({
    title: '',
    description: '',
    category: 'APPLICATION' as IncidentCategory,
    severity: 'HIGH' as IncidentSeverity,
    assignedUserId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alertApi.getAlerts({
        severity: filters.severity as AlertSeverity | undefined,
        status: filters.status as AlertStatus | undefined,
      });
      setAlerts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      await alertApi.generateAlerts(2);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate alerts');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertApi.acknowledgeAlert(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to acknowledge');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await alertApi.dismissAlert(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to dismiss');
    }
  };

  const openConvertModal = (alert: Alert) => {
    setConvertModal(alert);
    const severityMap: Record<AlertSeverity, IncidentSeverity> = {
      CRITICAL: 'CRITICAL',
      WARNING: 'HIGH',
      INFO: 'MEDIUM',
    };
    setConvertForm({
      title: alert.title,
      description: alert.description,
      category: 'APPLICATION',
      severity: severityMap[alert.severity],
      assignedUserId: '',
    });
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModal) return;
    setConverting(true);
    setError('');
    try {
      const result = await alertApi.convertAlertToIncident(convertModal.id, {
        title: convertForm.title,
        description: convertForm.description,
        category: convertForm.category,
        severity: convertForm.severity,
        assignedUserId: convertForm.assignedUserId || undefined,
      });
      setConvertModal(null);
      await load();
      navigate(`/incidents/${result.incident.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to convert alert');
    } finally {
      setConverting(false);
    }
  };

  const activeCount = alerts.filter(
    (a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED'
  ).length;

  return (
    <div>
      <PageHeader
        title="Monitoring Alerts"
        subtitle="Simulated monitoring system — generate, triage, and convert alerts to incidents"
        actions={
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Zap className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Mock Alerts'}
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Alerts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-orange-200/80 bg-orange-50/50 p-4 sm:col-span-2">
          <p className="text-sm text-orange-800">
            <strong>Monitoring API Simulator</strong> — Generates realistic NOC alerts from
            templates (Datadog, Prometheus, Grafana, etc.). Convert actionable alerts into
            tracked incidents.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select
          label="Severity"
          value={filters.severity}
          onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
          options={[
            { value: '', label: 'All severities' },
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'WARNING', label: 'Warning' },
            { value: 'INFO', label: 'Info' },
          ]}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          options={[
            { value: '', label: 'All statuses' },
            ...Object.entries(alertStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No monitoring alerts"
          description="Click Generate Mock Alerts to simulate incoming events"
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Radio className="h-4 w-4 shrink-0 text-slate-400" />
                    <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                    <SeverityBadge severity={alert.severity} />
                    <StatusBadge
                      status={alert.status}
                      label={alertStatusLabels[alert.status]}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{alert.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Service: {alert.service}</span>
                    <span>Source: {alert.sourceSystem}</span>
                    <span>{formatRelative(alert.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {alert.status === 'NEW' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(alert.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Acknowledge
                      </button>
                      <button
                        type="button"
                        onClick={() => openConvertModal(alert)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Convert
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(alert.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                      >
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </>
                  )}
                  {alert.status === 'ACKNOWLEDGED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => openConvertModal(alert)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Convert
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(alert.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                      >
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </>
                  )}
                  {alert.incident && (
                    <Link
                      to={`/incidents/${alert.incident.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Incident
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!convertModal}
        onClose={() => setConvertModal(null)}
        title="Convert Alert to Incident"
        wide
      >
        {convertModal && (
          <form onSubmit={handleConvert} className="space-y-4">
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Converting: <strong>{convertModal.title}</strong> ({convertModal.service})
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
              <input
                required
                value={convertForm.title}
                onChange={(e) => setConvertForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
              <textarea
                required
                rows={4}
                value={convertForm.description}
                onChange={(e) =>
                  setConvertForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                value={convertForm.category}
                onChange={(v) =>
                  setConvertForm((f) => ({ ...f, category: v as IncidentCategory }))
                }
                options={Object.entries(incidentCategoryLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Select
                label="Incident severity"
                value={convertForm.severity}
                onChange={(v) =>
                  setConvertForm((f) => ({ ...f, severity: v as IncidentSeverity }))
                }
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'CRITICAL', label: 'Critical' },
                ]}
              />
            </div>
            <Select
              label="Assign to"
              value={convertForm.assignedUserId}
              onChange={(v) => setConvertForm((f) => ({ ...f, assignedUserId: v }))}
              options={[
                { value: '', label: 'Unassigned' },
                ...users.map((u) => ({ value: u.id, label: u.fullName })),
              ]}
            />
            <button
              type="submit"
              disabled={converting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {converting ? 'Converting...' : 'Create Incident from Alert'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
