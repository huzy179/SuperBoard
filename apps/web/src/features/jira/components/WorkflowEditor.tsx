'use client';

import { useState, useEffect } from 'react';
import type { WorkflowStatusCategory } from '@superboard/shared';

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

  const statuses = data?.statuses ?? [];

  return (
    <div className="flex flex-col gap-12 pb-32 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3">
            {title || 'Workflow Core'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">
              {description || 'Neural configuration for project logic pathways.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">{extraActions}</div>
      </header>

      {/* STATUSES SECTION */}
      <section className="relative group overflow-hidden rounded-[3rem] border border-white/20 bg-white/40 shadow-glass backdrop-blur-3xl transition-all">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <div className="px-10 py-6 border-b border-white/20 bg-white/40 flex justify-between items-center">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-500" />
            Logic States Configuration
          </h2>
          <span className="text-[10px] font-black text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full uppercase tracking-widest">
            {statuses.length} active nodes
          </span>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statuses.map((status) => (
              <div
                key={status.id}
                className="group/item relative flex flex-col gap-4 p-6 rounded-[2rem] border border-white bg-white/50 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      status.category === 'done'
                        ? 'bg-emerald-100 text-emerald-700'
                        : status.category === 'todo'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-brand-100 text-brand-700'
                    }`}
                  >
                    {status.category}
                  </div>
                  {!status.isSystem && (
                    <div className="flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingStatusId(status.id);
                          setEditName(status.name);
                        }}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteStatus(status.id)}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  {editingStatusId === status.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveStatusName(status.id)}
                        className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-sm font-black shadow-inner"
                      />
                    </div>
                  ) : (
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">
                      {status.name}
                    </h4>
                  )}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Node: {status.key}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-10 border-t border-black/5">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 px-2">
              Initialize New Node
            </h3>
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Status Name (e.g. Quality Assurance)"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                className="flex-1 min-w-[300px] px-8 py-5 bg-white/60 border border-white/40 rounded-3xl focus:bg-white focus:border-brand-500/50 outline-none transition-all font-bold text-lg text-slate-800 shadow-inner"
              />
              <select
                value={newStatusCategory}
                onChange={(e) => setNewStatusCategory(e.target.value as WorkflowStatusCategory)}
                className="px-8 py-5 rounded-3xl border border-white/40 bg-white/60 focus:bg-white focus:border-brand-500/50 outline-none transition-all font-black uppercase text-xs tracking-widest shadow-inner appearance-none pr-12"
              >
                <option value="todo">Chưa thực hiện</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="in_review">Đang review</option>
                <option value="done">Hoàn thành</option>
                <option value="blocked">Bị chặn</option>
              </select>
              <button
                onClick={handleAddStatus}
                disabled={isPending || !newStatusName.trim()}
                className="px-10 py-5 bg-slate-900 hover:bg-brand-600 disabled:bg-slate-300 text-white font-black rounded-3xl shadow-2xl transition-all active:scale-95 uppercase text-[10px] tracking-widest"
              >
                {isPending ? 'Propagating...' : 'Register Node'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSITION MATRIX SECTION */}
      <section className="relative overflow-hidden rounded-[3rem] border border-white/20 bg-white/40 shadow-glass backdrop-blur-3xl">
        <div className="px-10 py-8 border-b border-white/20 bg-white/40 flex justify-between items-center">
          <div>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Transition Logic Matrix
            </h2>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
              Define valid state migration pathways
            </p>
          </div>
          {isMatrixDirty && (
            <button
              onClick={handleSaveTransitions}
              disabled={isPending}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest"
            >
              {isPending ? 'Syncing...' : 'Commit Matrix'}
            </button>
          )}
        </div>
        <div className="p-10 overflow-x-auto">
          <table className="w-full border-separate border-spacing-2">
            <thead>
              <tr>
                <th className="p-4 border-b border-black/5">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block text-left">
                    Source \ Target
                  </span>
                </th>
                {statuses.map((s) => (
                  <th key={s.id} className="p-4 border-b border-black/5">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      {s.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((from) => (
                <tr key={from.id}>
                  <td className="p-4 border-r border-black/5 bg-white/10 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                      {from.name}
                    </span>
                  </td>
                  {statuses.map((to) => {
                    const isAllowed = localTransitions.has(`${from.id}_${to.id}`);
                    const isSelf = from.id === to.id;

                    return (
                      <td key={to.id} className="p-2">
                        {isSelf ? (
                          <div className="h-3 w-3 bg-slate-200 rounded-full mx-auto opacity-20" />
                        ) : (
                          <button
                            onClick={() => toggleTransition(from.id, to.id)}
                            className={`group relative h-10 w-full rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                              isAllowed
                                ? 'bg-slate-900 border-slate-900 text-emerald-400 shadow-xl scale-[1.05] z-10'
                                : 'bg-white/40 border-white text-slate-300 hover:border-brand-300'
                            }`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                isAllowed
                                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                                  : 'bg-slate-200 group-hover:bg-brand-400'
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

          <div className="mt-10 flex items-center gap-8 px-6 py-4 bg-white/40 rounded-3xl border border-white/60">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">
                Authorized Pathway
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-slate-200" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Restricted Pathway
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
