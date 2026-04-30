'use client';

import { useState, useEffect } from 'react';
import { Settings2, Trash2, ChevronDown, Cpu } from 'lucide-react';
import type { WorkflowStatusCategory } from '@superboard/shared';
import { AppButton } from '@/components/ui/app-button';

interface WorkflowData {
  statuses: {
    id: string;
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position: number;
    isSystem: boolean;
  }[];
  transitions: {
    id?: string;
    fromStatusId: string;
    toStatusId: string;
  }[];
}

interface WorkflowEditorProps {
  data?: WorkflowData;
  isLoading: boolean;
  onAddStatus: (data: {
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position: number;
  }) => Promise<void>;
  onUpdateStatus: (statusId: string, data: { name: string }) => Promise<void>;
  onDeleteStatus: (statusId: string) => Promise<void>;
  onSaveTransitions: (transitions: { fromStatusId: string; toStatusId: string }[]) => Promise<void>;
  isPending?: boolean;
  title?: string;
  description?: string;
  extraActions?: React.ReactNode;
}

export function WorkflowEditor({
  data,
  isLoading,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
  onSaveTransitions,
  isPending,
  title,
  description,
  extraActions,
}: WorkflowEditorProps) {
  const [localTransitions, setLocalTransitions] = useState<Set<string>>(new Set());
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusCategory, setNewStatusCategory] = useState<WorkflowStatusCategory>('todo');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (data?.transitions) {
      const set = new Set<string>();
      data.transitions.forEach((t) => {
        set.add(`${t.fromStatusId}_${t.toStatusId}`);
      });
      setLocalTransitions(set);
      setIsMatrixDirty(false);
    }
  }, [data?.transitions]);

  const toggleTransition = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const key = `${fromId}_${toId}`;
    const next = new Set(localTransitions);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setLocalTransitions(next);
    setIsMatrixDirty(true);
  };

  const handleSaveTransitions = () => {
    const transitions = Array.from(localTransitions).map((key) => {
      const [fromStatusId, toStatusId] = key.split('_');
      return { fromStatusId: fromStatusId!, toStatusId: toStatusId! };
    });
    void onSaveTransitions(transitions);
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await onAddStatus({
      key: newStatusName.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newStatusName.trim(),
      category: newStatusCategory,
      position: (data?.statuses?.length ?? 0) + 1,
    });
    setNewStatusName('');
  };

  const handleSaveStatusName = async (statusId: string) => {
    if (!editName.trim()) return;
    await onUpdateStatus(statusId, { name: editName.trim() });
    setEditingStatusId(null);
  };

  if (isLoading) return <div className="p-8">Đang tải cấu hình quy trình...</div>;

  const statuses = data?.statuses || [];

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="flex items-center justify-between px-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[color:var(--color-ink)] tracking-tight mb-2">
            {title || 'Workflow Core'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-brand-500" />
            <p className="text-sm text-[color:var(--color-muted)]">
              {description || 'Neural configuration for project logic pathways.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">{extraActions}</div>
      </header>

      {/* STATUSES SECTION */}
      <section className="rounded-2xl border border-surface-border bg-surface-card shadow-luxe">
        <div className="px-8 py-6 border-b border-surface-border flex justify-between items-center">
          <h2 className="text-sm font-semibold text-[color:var(--color-ink)] flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Logic states
          </h2>
          <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-[0.125px] text-[color:var(--color-focus)]">
            {statuses.length} statuses
          </span>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statuses.map((status) => (
              <div
                key={status.id}
                className={`group/item relative flex flex-col gap-5 p-6 rounded-xl border transition-colors shadow-inner ${
                  status.category === 'done'
                    ? 'border-emerald-500/20 bg-emerald-50'
                    : status.category === 'todo'
                      ? 'border-surface-border bg-surface-card'
                      : 'border-brand-500/15 bg-brand-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold tracking-[0.125px] border ${
                      status.category === 'done'
                        ? 'bg-white text-emerald-700 border-emerald-200'
                        : status.category === 'todo'
                          ? 'bg-black/[0.02] text-[color:var(--color-muted)] border-surface-border'
                          : 'bg-white text-[color:var(--color-focus)] border-brand-500/20'
                    }`}
                  >
                    {status.category}
                  </div>
                  {!status.isSystem && (
                    <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingStatusId(status.id);
                          setEditName(status.name);
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-black/[0.02] hover:bg-black/[0.04] rounded-lg text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors border border-surface-border"
                        aria-label="Edit status"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteStatus(status.id)}
                        className="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-700 transition-colors border border-rose-200"
                        aria-label="Delete status"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {editingStatusId === status.id ? (
                    <div className="relative group/edit">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveStatusName(status.id)}
                        className="form-input-lg"
                      />
                    </div>
                  ) : (
                    <h4 className="text-xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-tight">
                      {status.name}
                    </h4>
                  )}
                  <p className="text-xs text-[color:var(--color-faint)]">ID: {status.key}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-surface-border">
            <h3 className="text-sm font-semibold text-[color:var(--color-ink)] mb-4">Add status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Tên trạng thái (VD: QA, Review...)"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddStatus()}
                  className="form-input-lg"
                />
              </div>
              <div className="relative">
                <select
                  value={newStatusCategory}
                  onChange={(e) => setNewStatusCategory(e.target.value as WorkflowStatusCategory)}
                  className="form-select h-[52px] px-4"
                >
                  <option value="todo">Chưa thực hiện</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="in_review">Đang review</option>
                  <option value="done">Hoàn thành</option>
                  <option value="blocked">Bị chặn</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none"
                  size={16}
                />
              </div>
              <AppButton
                type="button"
                onClick={() => void handleAddStatus()}
                disabled={Boolean(isPending) || !newStatusName.trim()}
                isLoading={Boolean(isPending)}
                variant="primary"
              >
                Add
              </AppButton>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSITION MATRIX SECTION */}
      <section className="rounded-2xl border border-surface-border bg-surface-card shadow-luxe">
        <div className="px-8 py-6 border-b border-surface-border flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--color-ink)] flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Transition matrix
            </h2>
            <p className="text-sm text-[color:var(--color-muted)] mt-1">
              Cho phép chuyển trạng thái từ A → B.
            </p>
          </div>
          {isMatrixDirty && (
            <AppButton
              type="button"
              onClick={handleSaveTransitions}
              disabled={Boolean(isPending)}
              isLoading={Boolean(isPending)}
              variant="primary"
            >
              Save
            </AppButton>
          )}
        </div>
        <div className="p-8 overflow-x-auto elite-scrollbar">
          <table className="w-full border-separate border-spacing-3">
            <thead>
              <tr>
                <th className="p-4 border-b border-surface-border text-left text-xs font-semibold text-[color:var(--color-muted)]">
                  From \\ To
                </th>
                {statuses.map((s) => (
                  <th key={s.id} className="p-4 border-b border-surface-border text-left">
                    <span className="text-xs font-semibold text-[color:var(--color-muted)] block">
                      {s.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((from) => (
                <tr key={from.id}>
                  <td className="p-4 border-r border-surface-border bg-[color:var(--color-surface-alt)]/40 rounded-xl shadow-inner">
                    <span className="text-sm font-medium text-[color:var(--color-ink)]">
                      {from.name}
                    </span>
                  </td>
                  {statuses.map((to) => {
                    const isAllowed = localTransitions.has(`${from.id}_${to.id}`);
                    const isSelf = from.id === to.id;

                    return (
                      <td key={to.id} className="p-2">
                        {isSelf ? (
                          <div className="h-10 w-full bg-black/[0.02] rounded-lg flex items-center justify-center opacity-60 border border-surface-border">
                            <span className="text-xs text-[color:var(--color-faint)]">—</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleTransition(from.id, to.id)}
                            className={`h-10 w-full rounded-lg flex items-center justify-center transition-colors border shadow-inner ${
                              isAllowed
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
                            }`}
                            aria-pressed={isAllowed}
                          >
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                isAllowed ? 'bg-emerald-500' : 'bg-black/10'
                              }`}
                            />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex flex-wrap items-center gap-6 px-6 py-4 bg-[color:var(--color-surface-alt)]/40 rounded-xl border border-surface-border shadow-inner">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-[color:var(--color-muted)]">Allowed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-black/10 border border-surface-border" />
              <span className="text-sm text-[color:var(--color-muted)]">Not allowed</span>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-[color:var(--color-faint)]">
              <Cpu size={14} className="text-[color:var(--color-faint)]" />
              Matrix editable
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
