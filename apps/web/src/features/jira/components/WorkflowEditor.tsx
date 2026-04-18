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

  const statuses = data?.statuses || [];

  return (
    <div className="flex flex-col gap-16 pb-32 animate-in fade-in duration-1000">
      <header className="flex items-center justify-between px-8">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-4">
            {title || 'Workflow Core'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-brand-500 shadow-glow-brand animate-pulse" />
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
              {description || 'Neural configuration for project logic pathways.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">{extraActions}</div>
      </header>

      {/* STATUSES SECTION */}
      <section className="relative group overflow-hidden rounded-[3.5rem] border border-white/5 bg-white/[0.01] shadow-luxe backdrop-blur-3xl transition-all">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="px-12 py-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-glow-brand" />
            Logic States Configuration
          </h2>
          <span className="text-[10px] font-black text-brand-400 bg-brand-500/5 border border-brand-500/20 px-6 py-2 rounded-full uppercase tracking-widest shadow-glow-brand/5">
            {statuses.length} ACTIVE_NODES_DETACHED
          </span>
        </div>
        <div className="p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {statuses.map((status) => (
              <div
                key={status.id}
                className={`group/item relative flex flex-col gap-6 p-8 rounded-[2.5rem] border transition-all duration-500 shadow-inner ${
                  status.category === 'done'
                    ? 'border-emerald-500/10 bg-emerald-500/[0.01] hover:bg-emerald-500/[0.03] hover:border-emerald-500/30'
                    : status.category === 'todo'
                      ? 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20'
                      : 'border-brand-500/10 bg-brand-500/[0.01] hover:bg-brand-500/[0.03] hover:border-brand-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      status.category === 'done'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-emerald/5'
                        : status.category === 'todo'
                          ? 'bg-white/5 text-white/40 border-white/10'
                          : 'bg-brand-500/10 text-brand-400 border-brand-500/20 shadow-glow-brand/5'
                    }`}
                  >
                    {status.category}
                  </div>
                  {!status.isSystem && (
                    <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      <button
                        onClick={() => {
                          setEditingStatusId(status.id);
                          setEditName(status.name);
                        }}
                        className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-brand-400 transition-all border border-transparent hover:border-white/10"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteStatus(status.id)}
                        className="w-9 h-9 flex items-center justify-center bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-rose-500/40 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/10"
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
                        className="w-full px-6 py-4 bg-slate-950/80 border border-brand-500/30 rounded-2xl text-base font-black text-white shadow-luxe outline-none focus:border-brand-500 transition-all uppercase"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-brand-500/50 uppercase tracking-widest">
                        COMMIT_READY
                      </span>
                    </div>
                  ) : (
                    <h4 className="text-2xl font-black text-white tracking-tighter uppercase leading-none italic group-hover/item:text-brand-400 transition-colors">
                      {status.name}
                    </h4>
                  )}
                  <p className="text-[10px] font-black text-white/10 uppercase tracking-widest transition-colors group-hover/item:text-white/20">
                    ID: {status.key}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-16 border-t border-white/5 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-8 py-2 border border-white/5 rounded-full text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
              Neural Growth Sector
            </div>

            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-10 px-4 text-center">
              Initialize New Logic Node
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
              <div className="md:col-span-2 relative group-within/input">
                <input
                  type="text"
                  placeholder="NODE_DESIGNATION (E.G. QUALITY_ASSURANCE)"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                  className="w-full px-10 py-6 bg-white/[0.01] border border-white/5 rounded-[2rem] focus:bg-white/[0.02] focus:border-brand-500/40 outline-none transition-all font-black text-xl text-white shadow-inner uppercase placeholder:text-white/5"
                />
              </div>
              <div className="relative">
                <select
                  value={newStatusCategory}
                  onChange={(e) => setNewStatusCategory(e.target.value as WorkflowStatusCategory)}
                  className="w-full appearance-none px-10 py-6 rounded-[2rem] border border-white/5 bg-white/[0.01] focus:bg-white/[0.02] focus:border-brand-500/40 outline-none transition-all font-black uppercase text-xs tracking-[0.2em] text-white/60 shadow-inner"
                >
                  <option value="todo">Chưa thực hiện</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="in_review">Đang review</option>
                  <option value="done">Hoàn thành</option>
                  <option value="blocked">Bị chặn</option>
                </select>
                <ChevronDown
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none"
                  size={16}
                />
              </div>
              <button
                onClick={handleAddStatus}
                disabled={isPending || !newStatusName.trim()}
                className="relative overflow-hidden px-10 py-6 bg-brand-500 hover:scale-105 disabled:bg-white/5 disabled:scale-100 text-white font-black rounded-[2rem] shadow-glow-brand/20 transition-all active:scale-95 uppercase text-[11px] tracking-[0.3em] group/btn"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
                {isPending ? 'Propagating...' : 'Register Node'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSITION MATRIX SECTION */}
      <section className="relative overflow-hidden rounded-[3.5rem] border border-white/5 bg-white/[0.01] shadow-luxe backdrop-blur-3xl transition-all">
        <div className="px-12 py-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/[0.01] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-glow-emerald animate-pulse" />
              Transition Logic Matrix
            </h2>
            <p className="text-[9px] font-black text-white/10 mt-2 uppercase tracking-[0.3em]">
              Mapping neural migration pathways
            </p>
          </div>
          {isMatrixDirty && (
            <button
              onClick={handleSaveTransitions}
              disabled={isPending}
              className="relative overflow-hidden px-12 py-4 bg-emerald-500 hover:scale-105 text-white text-[10px] font-black rounded-2xl shadow-glow-emerald/20 transition-all active:scale-95 uppercase tracking-[0.3em]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
              {isPending ? 'Syncing...' : 'Commit Matrix'}
            </button>
          )}
        </div>
        <div className="p-12 overflow-x-auto elite-scrollbar">
          <table className="w-full border-separate border-spacing-4">
            <thead>
              <tr>
                <th className="p-6 border-b border-white/5">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
                      ORIGIN
                    </span>
                    <span className="text-white/40 px-3 py-1 bg-white/5 rounded-lg">↘</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 ml-8 text-right">
                      TARGET
                    </span>
                  </div>
                </th>
                {statuses.map((s) => (
                  <th
                    key={s.id}
                    className="p-6 border-b border-white/5 group/th transition-all hover:bg-white/[0.02] rounded-3xl"
                  >
                    <span className="text-xs font-black text-white/40 group-hover/th:text-white uppercase tracking-widest transition-colors block">
                      {s.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((from) => (
                <tr key={from.id}>
                  <td className="p-6 border-r border-white/5 bg-white/[0.02] rounded-[1.5rem] shadow-inner">
                    <span className="text-xs font-black text-white/60 uppercase tracking-widest">
                      {from.name}
                    </span>
                  </td>
                  {statuses.map((to) => {
                    const isAllowed = localTransitions.has(`${from.id}_${to.id}`);
                    const isSelf = from.id === to.id;

                    return (
                      <td key={to.id} className="p-3">
                        {isSelf ? (
                          <div className="h-10 w-full bg-white/[0.02] rounded-2xl flex items-center justify-center opacity-10">
                            <span className="text-[8px] font-black">X</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleTransition(from.id, to.id)}
                            className={`group h-12 w-full rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-inner ${
                              isAllowed
                                ? 'bg-white/10 border-white/20 text-emerald-400 shadow-glow-emerald/10 scale-105 z-10'
                                : 'bg-white/[0.01] border-white/5 text-white/5 hover:border-brand-500/30'
                            }`}
                          >
                            <div
                              className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                                isAllowed
                                  ? 'bg-emerald-500 shadow-glow-emerald'
                                  : 'bg-white/5 group-hover:bg-brand-500/50'
                              }`}
                            />
                            {isAllowed && (
                              <motion.div
                                layoutId={`trans-${from.id}-${to.id}`}
                                className="absolute inset-0 border-2 border-emerald-500/40 rounded-2xl animate-pulse pointer-events-none"
                              />
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-16 flex items-center gap-12 px-10 py-6 bg-white/[0.01] rounded-[2.5rem] border border-white/5 shadow-inner">
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-glow-emerald" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                Authorized Pathway
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded-full bg-white/5 border border-white/10" />
              <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
                Restricted Pathway
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Cpu size={14} className="text-white/10" />
              <span className="text-[9px] font-black text-white/5 uppercase tracking-[0.5em]">
                LOGIC_LAYER_4_ACTIVE
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
