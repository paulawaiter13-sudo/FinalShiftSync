import { useState } from 'react';
import { Bot, Copy, Check, Pencil, Save, X } from 'lucide-react';
import type { ShiftSummary } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDate, formatShiftRange } from '../../utils/format';
import { shiftTypeLabels } from '../../utils/labels';
import { updateSummary } from '../../services/summaryService';

interface SummaryCardProps {
  summary: ShiftSummary;
  onUpdate?: (updated: ShiftSummary) => void;
  defaultExpanded?: boolean;
}

export function SummaryCard({
  summary,
  onUpdate,
  defaultExpanded = false,
}: SummaryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(summary.generatedText);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary.generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      const updated = await updateSummary(summary.id, text);
      onUpdate(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const shiftLabel = shiftTypeLabels[summary.shift.shiftType] ?? summary.shift.shiftType;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-semibold text-slate-900">
              {shiftLabel} Shift Summary
            </p>
            <p className="text-xs text-slate-500">
              {formatShiftRange(summary.shift.startTime, summary.shift.endTime)} ·{' '}
              {summary.shift.responsible.fullName} · {formatDate(summary.generatedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary.generatedByAI && <Badge variant="info">AI Generated</Badge>}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5">
          {editing ? (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText(summary.generatedText);
                    setEditing(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
                {summary.generatedText}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy
                    </>
                  )}
                </button>
                {onUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      setText(summary.generatedText);
                      setEditing(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
