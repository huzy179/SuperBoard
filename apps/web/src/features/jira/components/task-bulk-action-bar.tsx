'use client';

import { useState } from 'react';
import { X, Trash2, User, Flag, Loader2, SquareCheck, MousePointer2 } from 'lucide-react';
import type { ProjectMemberDTO, ProjectTaskItemDTO, TaskPriorityDTO } from '@superboard/shared';
import { BOARD_COLUMNS, PRIORITY_OPTIONS } from '@/lib/constants/task';

type TaskBulkActionBarProps = {
  members: ProjectMemberDTO[];
  selectedCount: number;
  selectedVisibleCount: number;
  totalVisibleCount: number;
  bulkStatus: ProjectTaskItemDTO['status'];
  bulkPriority: TaskPriorityDTO;
  bulkAssigneeId: string;
  isStatusPending: boolean;
  isPriorityPending: boolean;
  isAssignPending: boolean;
  isDeletePending: boolean;
  onBulkStatusChange: (value: ProjectTaskItemDTO['status']) => void;
  onBulkPriorityChange: (value: TaskPriorityDTO) => void;
  onBulkAssigneeIdChange: (value: string) => void;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onApplyStatus: () => void;
  onApplyPriority: () => void;
  onApplyAssignee: () => void;
  onDeleteSelected: () => void;
  workflow?:
    | {
        statuses: { key: string; label?: string; name?: string }[];
      }
    | undefined;
};

export function TaskBulkActionBar(props: TaskBulkActionBarProps) {
  const {
    members,
    selectedCount,
    selectedVisibleCount,
    totalVisibleCount,
    bulkStatus,
    bulkPriority,
    bulkAssigneeId,
    isStatusPending,
    isPriorityPending,
    isAssignPending,
    isDeletePending,
    onBulkStatusChange,
    onBulkPriorityChange,
    onBulkAssigneeIdChange,
    onToggleSelectAllVisible,
    onClearSelection,
    onApplyStatus,
    onApplyPriority,
    onApplyAssignee,
    onDeleteSelected,
    workflow,
  } = props;

  const [activeMenu, setActiveMenu] = useState<'status' | 'priority' | 'assignee' | null>(null);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] w-full max-w-4xl px-6 pointer-events-none">
      <div className="pointer-events-auto rounded-[3rem] border border-white/10 bg-slate-950/40 p-2 shadow-luxe backdrop-blur-[60px] animate-in slide-in-from-bottom-20 fade-in duration-1000 relative group overflow-hidden">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Unified Bridge Container */}
        <div className="bg-white/[0.01] rounded-[2.5rem] flex items-center h-20 px-4 gap-4 border border-white/5 relative z-10">
          {/* Tactical Intel Section */}
          <div className="flex items-center gap-6 pl-6 pr-8 border-r border-white/5 h-12">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 blur-lg opacity-40 animate-pulse" />
              <div className="relative w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-glow-brand/20">
                {selectedCount}
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] block leading-none italic">
                SYNCED_UNITS
              </span>
              <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] block">
                STABLE_NODE_LINK
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95 group/clear"
              title="Clear Selection"
            >
              <X size={16} className="group-hover/clear:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Action Hub */}
          <div className="flex flex-1 items-center gap-3">
            {/* Status Protocol */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'status' ? null : 'status')}
                className={`h-12 px-6 rounded-[1.5rem] flex items-center gap-4 transition-all duration-500 border ${
                  activeMenu === 'status'
                    ? 'bg-white border-white text-slate-950 shadow-luxe scale-105'
                    : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Loader2
                  size={16}
                  className={isStatusPending ? 'animate-spin text-brand-500' : ''}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                  STATE
                </span>
              </button>

              <AnimatePresence>
                {activeMenu === 'status' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: -12 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute bottom-full left-0 mb-6 rounded-[2.5rem] border border-white/10 bg-slate-950/90 p-3 w-72 backdrop-blur-3xl shadow-luxe z-50 overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
                    <div className="space-y-1.5 p-1">
                      {(workflow?.statuses || BOARD_COLUMNS).map((s) => (
                        <button
                          key={s.key}
                          onClick={() => {
                            onBulkStatusChange(s.key);
                            onApplyStatus();
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 text-left rounded-2xl transition-all duration-300 group/item ${
                            bulkStatus === s.key
                              ? 'text-brand-400 bg-brand-500/10 border border-brand-500/10'
                              : 'text-white/30 border border-transparent hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-widest italic group-hover/item:translate-x-1 transition-transform">
                            {s.label || s.name}
                          </span>
                          {bulkStatus === s.key && (
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-glow-brand animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Priority Protocol */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'priority' ? null : 'priority')}
                className={`h-12 px-6 rounded-[1.5rem] flex items-center gap-4 transition-all duration-500 border ${
                  activeMenu === 'priority'
                    ? 'bg-white border-white text-slate-950 shadow-luxe scale-105'
                    : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flag
                  size={16}
                  className={isPriorityPending ? 'animate-pulse text-indigo-500' : ''}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                  RANK
                </span>
              </button>

              <AnimatePresence>
                {activeMenu === 'priority' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: -12 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute bottom-full left-0 mb-6 rounded-[2.5rem] border border-white/10 bg-slate-950/90 p-3 w-64 backdrop-blur-3xl shadow-luxe z-50 overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    <div className="space-y-1.5 p-1">
                      {PRIORITY_OPTIONS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => {
                            onBulkPriorityChange(p.key as TaskPriorityDTO);
                            onApplyPriority();
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 text-left rounded-2xl transition-all duration-300 group/item ${
                            bulkPriority === p.key
                              ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                              : 'text-white/30 border border-transparent hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-widest italic group-hover/item:translate-x-1 transition-transform">
                            {p.label}
                          </span>
                          {bulkPriority === p.key && (
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-glow-indigo animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Operator Protocol */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'assignee' ? null : 'assignee')}
                className={`h-12 px-6 rounded-[1.5rem] flex items-center gap-4 transition-all duration-500 border ${
                  activeMenu === 'assignee'
                    ? 'bg-white border-white text-slate-950 shadow-luxe scale-105'
                    : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <User
                  size={16}
                  className={isAssignPending ? 'animate-pulse text-emerald-500' : ''}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                  OPERATOR
                </span>
              </button>

              <AnimatePresence>
                {activeMenu === 'assignee' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: -12 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute bottom-full left-0 mb-6 rounded-[2.5rem] border border-white/10 bg-slate-950/90 p-3 w-80 backdrop-blur-3xl shadow-luxe z-50 overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                    <div className="space-y-1.5 p-1">
                      <button
                        onClick={() => {
                          onBulkAssigneeIdChange('');
                          onApplyAssignee();
                          setActiveMenu(null);
                        }}
                        className="w-full px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-2xl transition-all mb-2 border border-rose-500/10 italic"
                      >
                        DE-SYNC ALL_UNITS
                      </button>
                      <div className="max-h-72 overflow-y-auto elite-scrollbar space-y-1.5">
                        {members.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              onBulkAssigneeIdChange(m.id);
                              onApplyAssignee();
                              setActiveMenu(null);
                            }}
                            className={`w-full flex items-center gap-5 px-6 py-4 text-left rounded-2xl transition-all duration-300 group/item ${
                              bulkAssigneeId === m.id
                                ? 'text-brand-400 bg-brand-500/10 border border-brand-500/10'
                                : 'text-white/30 border border-transparent hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/5 font-black flex items-center justify-center text-[10px] border border-white/5 shadow-inner">
                              {m.fullName.charAt(0)}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight truncate flex-1 italic group-hover/item:translate-x-1 transition-transform">
                              {m.fullName}
                            </span>
                            {bulkAssigneeId === m.id && (
                              <div className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-glow-brand animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tactical Override Group */}
            <div className="h-10 w-px bg-white/5 mx-2" />
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSelectAllVisible}
                className={`h-12 w-12 rounded-[1.25rem] flex items-center justify-center border transition-all duration-500 active:scale-90 ${
                  selectedVisibleCount === totalVisibleCount
                    ? 'bg-brand-500 border-brand-500 text-white shadow-glow-brand/20'
                    : 'bg-white/[0.02] border-white/5 text-white/20 hover:text-white/80 hover:bg-white/5'
                }`}
                title={
                  selectedVisibleCount === totalVisibleCount ? 'Deselect All' : 'Select All Visible'
                }
              >
                {selectedVisibleCount === totalVisibleCount ? (
                  <SquareCheck size={18} />
                ) : (
                  <MousePointer2 size={18} />
                )}
              </button>

              <button
                onClick={onDeleteSelected}
                disabled={isDeletePending}
                className="h-12 w-12 rounded-[1.25rem] flex items-center justify-center text-rose-500/30 hover:text-white hover:bg-rose-500 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-30 active:scale-90 shadow-glow-rose/0 hover:shadow-glow-rose/20"
                title="Purge Task"
              >
                {isDeletePending ? (
                  <Loader2 size={18} className="animate-spin text-rose-500" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Mission Conclusion */}
          <div className="pl-6 pr-2">
            <button
              onClick={onClearSelection}
              className="group relative h-14 px-10 rounded-[1.5rem] bg-white border border-white text-slate-950 font-black text-xs uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-luxe overflow-hidden"
            >
              <span className="relative z-10 italic">DONE</span>
              <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
