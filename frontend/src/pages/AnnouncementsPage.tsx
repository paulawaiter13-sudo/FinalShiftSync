import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Megaphone, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import * as announcementApi from '../services/announcementService';
import type { Announcement, AnnouncementPriority, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
import { formatDate } from '../utils/format';
import { announcementPriorityLabels } from '../utils/labels';
import { isAnnouncementRead, isExpired, markAnnouncementRead } from '../utils/announcements';
import { ApiError } from '../services/api';
import { useUnreadAnnouncements } from '../hooks/useUnreadAnnouncements';

const MANAGER_ROLES: UserRole[] = ['SHIFT_MANAGER', 'ADMIN'];

type Tab = 'all' | 'unread' | 'urgent';

function priorityVariant(p: AnnouncementPriority) {
  if (p === 'URGENT') return 'orange' as const;
  if (p === 'IMPORTANT') return 'warning' as const;
  return 'default' as const;
}

function shortId(id: string): string {
  return `ANN-${id.slice(-4).toUpperCase()}`;
}

export function AnnouncementsPage() {
  const { user } = useAuth();
  const canManage = user && MANAGER_ROLES.includes(user.role);
  const { refresh: refreshUnread } = useUnreadAnnouncements();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readVersion, setReadVersion] = useState(0);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL' as AnnouncementPriority,
    expiresAt: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await announcementApi.getAnnouncements({ includeExpired: false });
      setAnnouncements(data);
      setSelectedId((prev) => {
        if (prev && data.some((a) => a.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (tab === 'urgent' && a.priority !== 'URGENT') return false;
      if (tab === 'unread' && isAnnouncementRead(a.id)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          shortId(a.id).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [announcements, tab, readVersion, search]);

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? null;

  const unreadCount = announcements.filter((a) => !isAnnouncementRead(a.id)).length;

  const selectAnnouncement = (id: string) => {
    setSelectedId(id);
    markAnnouncementRead(id);
    setReadVersion((v) => v + 1);
    refreshUnread();
  };

  const handleMarkAsRead = () => {
    if (!selected) return;
    markAnnouncementRead(selected.id);
    setReadVersion((v) => v + 1);
    refreshUnread();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', priority: 'NORMAL', expiresAt: '' });
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        content: form.content,
        priority: form.priority,
        expiresAt: form.expiresAt || null,
      };
      if (editing) {
        await announcementApi.updateAnnouncement(editing.id, payload);
      } else {
        await announcementApi.createAnnouncement(payload);
      }
      setModalOpen(false);
      await load();
      refreshUnread();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementApi.deleteAnnouncement(id);
      await load();
      refreshUnread();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Manager Announcements"
        subtitle="Operational updates and procedures from shift management"
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          ) : undefined
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200">
        {(
          [
            { key: 'all' as Tab, label: `All (${announcements.length})` },
            { key: 'unread' as Tab, label: `Unread (${unreadCount})` },
            { key: 'urgent' as Tab, label: 'Urgent' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            {key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" />
      ) : (
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="border-b border-slate-100 lg:col-span-2 lg:border-b-0 lg:border-r">
              <div className="border-b border-slate-100 p-3">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search announcements..."
                />
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                <table className="data-table w-full text-sm">
                  <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/95">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="hidden px-3 py-2 sm:table-cell">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((a) => {
                      const unread = !isAnnouncementRead(a.id);
                      const active = selected?.id === a.id;
                      return (
                        <tr
                          key={a.id}
                          onClick={() => selectAnnouncement(a.id)}
                          className={`cursor-pointer transition-colors ${
                            active
                              ? 'border-l-2 border-l-blue-600 bg-blue-50/60'
                              : 'border-l-2 border-l-transparent hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-3 py-2.5 text-xs font-mono text-slate-500">
                            {shortId(a.id)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-start gap-1.5">
                              {a.priority === 'URGENT' && (
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                              )}
                              {unread && (
                                <span className="mt-0.5 rounded bg-orange-500 px-1 py-px text-[9px] font-bold text-white">
                                  NEW
                                </span>
                              )}
                              <span className="line-clamp-2 text-sm font-medium text-slate-800">
                                {a.title}
                              </span>
                            </div>
                          </td>
                          <td className="hidden px-3 py-2.5 text-xs text-slate-400 sm:table-cell">
                            {formatDate(a.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selected && (
              <div className="p-5 lg:col-span-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-slate-400">{shortId(selected.id)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={priorityVariant(selected.priority)}>
                        {announcementPriorityLabels[selected.priority]}
                      </Badge>
                      {!isAnnouncementRead(selected.id) && (
                        <Badge variant="orange">Unread</Badge>
                      )}
                      {isExpired(selected.expiresAt) && (
                        <Badge variant="default">Expired</Badge>
                      )}
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-slate-900">{selected.title}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <UserAvatar name={selected.creator.fullName} size="sm" />
                      <span>
                        Published {formatDate(selected.createdAt)} by {selected.creator.fullName}
                      </span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(selected)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                        aria-label="Edit announcement"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selected.id)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        aria-label="Delete announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {selected.priority === 'URGENT' && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <strong>Urgent:</strong> Immediate attention required
                  </div>
                )}

                <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selected.content}
                </div>

                {selected.expiresAt && (
                  <p className="mt-4 text-xs text-slate-400">
                    Expires: {formatDate(selected.expiresAt)}
                  </p>
                )}

                {!isAnnouncementRead(selected.id) && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Button onClick={handleMarkAsRead} size="sm">
                      Mark as Read
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Announcement' : 'New Announcement'}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Content</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(v) =>
                setForm((f) => ({ ...f, priority: v as AnnouncementPriority }))
              }
              options={Object.entries(announcementPriorityLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Expires (optional)
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Saving...' : editing ? 'Update' : 'Publish'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
