import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Bot } from 'lucide-react';
import * as summaryApi from '../services/summaryService';
import * as shiftApi from '../services/shiftService';
import type { Shift, ShiftSummary } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { SummaryCard } from '../components/summary/SummaryCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionCard } from '../components/ui/SectionCard';
import { Button } from '../components/ui/Button';
import { shiftTypeLabels } from '../utils/labels';
import { ApiError } from '../services/api';

export function SummariesPage() {
  const [summaries, setSummaries] = useState<ShiftSummary[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryList, shiftList] = await Promise.all([
        summaryApi.getSummaries(),
        shiftApi.getShifts(),
      ]);
      setSummaries(summaryList);
      setShifts(shiftList);
      const active = shiftList.find((s) => s.status === 'ACTIVE');
      setSelectedShiftId((prev) => prev || active?.id || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load summaries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!selectedShiftId) {
      setError('Select a shift to generate a summary');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const created = await summaryApi.generateSummary(selectedShiftId);
      setSummaries((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleSummaryUpdate = (updated: ShiftSummary) => {
    setSummaries((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  return (
    <div>
      <PageHeader
        title="AI Shift Summaries"
        subtitle="Auto-generated handover summaries powered by AI (Mock Llama provider)"
        actions={
          <Button onClick={handleGenerate} disabled={generating || !selectedShiftId}>
            <Sparkles className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate AI Summary'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <SectionCard title="Smart Handover Summary" icon={Bot} iconColor="text-blue-600">
          <p className="text-sm text-slate-600">
            Summaries are built from shift incidents, monitoring alerts, tasks, and handover
            notes. The mock Llama provider can be swapped for a real external API without
            changing the rest of the platform.
          </p>
        </SectionCard>
        <div className="card p-4">
          <Select
            label="Generate summary for shift"
            value={selectedShiftId}
            onChange={setSelectedShiftId}
            options={[
              { value: '', label: 'Select shift...' },
              ...shifts.map((s) => ({
                value: s.id,
                label: `${shiftTypeLabels[s.shiftType]} (${s.status}) — ${s.responsible.fullName}`,
              })),
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : summaries.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No summaries yet"
          description="Select a shift and click Generate AI Summary"
        />
      ) : (
        <div className="space-y-3">
          {summaries.map((summary, i) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              onUpdate={handleSummaryUpdate}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
