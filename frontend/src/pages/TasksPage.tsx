import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import * as taskApi from '../services/taskService';
import * as shiftApi from '../services/shiftService';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ListTodo } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { formatDate } from '../utils/format';
import { taskStatusLabels, taskPriorityLabels } from '../utils/labels';
import { ApiError } from '../services/api';

export function TasksPage() {
  const { users } = useUsers();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState<string | undefined>();

  const [filters, setFilters] = useState({ status: '', priority: '' });

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    assignedUserId: '',
    dueDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, current] = await Promise.all([
        taskApi.getTasks({
          status: filters.status as TaskStatus | undefined,
          priority: filters.priority as TaskPriority | undefined,
        }),
        shiftApi.getCurrentShift(),
      ]);
      setTasks(list);
      setCurrentShiftId(current?.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tasks');
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
    try {
      await taskApi.createTask({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        assignedUserId: form.assignedUserId || undefined,
        shiftId: currentShiftId,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      });
      setModalOpen(false);
      setForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedUserId: '',
        dueDate: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const markDone = async (id: string) => {
    try {
      await taskApi.updateTask(id, { status: 'DONE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update task');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskApi.deleteTask(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete task');
    }
  };

  const priorityVariant = (p: TaskPriority) =>
    p === 'HIGH' ? 'danger' : p === 'MEDIUM' ? 'warning' : 'success';

  return (
    <div>
      <PageHeader
        title="Task Management"
        subtitle="Open tasks for shift continuity and handover"
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          options={[
            { value: '', label: 'All statuses' },
            ...Object.entries(taskStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <Select
          label="Priority"
          value={filters.priority}
          onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
          options={[
            { value: '', label: 'All priorities' },
            ...Object.entries(taskPriorityLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks found" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="px-4 py-3 font-medium text-slate-600">Priority</th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">Assigned</th>
                <th className="px-4 py-3 font-medium text-slate-600">Due</th>
                <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{task.title}</p>
                    {task.description && (
                      <p className="line-clamp-1 text-xs text-slate-400">{task.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={priorityVariant(task.priority)}>
                      {taskPriorityLabels[task.priority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={task.status}
                      label={taskStatusLabels[task.status]}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.assignedUser?.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {task.status !== 'DONE' && (
                        <button
                          type="button"
                          onClick={() => markDone(task.id)}
                          className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                          title="Mark done"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(task.id)}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Task" wide>
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
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
              options={Object.entries(taskPriorityLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Select
              label="Assign to"
              value={form.assignedUserId}
              onChange={(v) => setForm((f) => ({ ...f, assignedUserId: v }))}
              options={[
                { value: '', label: 'Unassigned' },
                ...users.map((u) => ({ value: u.id, label: u.fullName })),
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Due date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
