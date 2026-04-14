'use client';

import { useState } from 'react';
import { X, Check, Trash2, User, Flag, Loader2, SquareCheck, MousePointer2 } from 'lucide-react';
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="glass-panel p-1 rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]">
        <div className="bg-slate-900 rounded-[1.8rem] flex items-center h-16 px-2 gap-4">
          {/* Selected Info */}
          <div className="flex items-center gap-3 pl-4 pr-6 border-r border-white/10 h-10">
            <div className="w-6 h-6 bg-brand-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-brand-600/30">
              {selectedCount}
            </div>
            <span className="text-[11px] font-black text-white/90 uppercase tracking-widest whitespace-nowrap">
              Đã Chọn
            </span>
            <button
              onClick={onClearSelection}
              className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white transition-colors"
              title="Hủy chọn"
            >
              <X size={14} />
            </button>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1">
            {/* Status Action */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'status' ? null : 'status')}
                className={`h-11 px-4 rounded-2xl flex items-center gap-2 transition-all group ${activeMenu === 'status' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Loader2 size={16} className={isStatusPending ? 'animate-spin' : ''} />
                <span className="text-[11px] font-black uppercase tracking-widest">Trạng thái</span>
              </button>
              {activeMenu === 'status' && (
                <div className="absolute bottom-full mb-4 left-0 glass-panel p-1 rounded-2xl w-56 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-slate-800 rounded-xl overflow-hidden py-1">
                    {(workflow?.statuses || BOARD_COLUMNS).map((s) => (
                      <button
                        key={s.key}
                        onClick={() => {
                          onBulkStatusChange(s.key);
                          onApplyStatus();
                          setActiveMenu(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition-all ${bulkStatus === s.key ? 'text-brand-400 bg-brand-500/5' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(s as any).label || (s as any).name}
                        </span>
                        {bulkStatus === s.key && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Priority Action */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'priority' ? null : 'priority')}
                className={`h-11 px-4 rounded-2xl flex items-center gap-2 transition-all group ${activeMenu === 'priority' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Flag size={16} className={isPriorityPending ? 'animate-pulse' : ''} />
                <span className="text-[11px] font-black uppercase tracking-widest">Ưu tiên</span>
              </button>
              {activeMenu === 'priority' && (
                <div className="absolute bottom-full mb-4 left-0 glass-panel p-1 rounded-2xl w-48 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-slate-800 rounded-xl overflow-hidden py-1">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          onBulkPriorityChange(p.key as TaskPriorityDTO);
                          onApplyPriority();
                          setActiveMenu(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition-all ${bulkPriority === p.key ? 'text-brand-400 bg-brand-500/5' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span>{p.label}</span>
                        {bulkPriority === p.key && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assignee Action */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'assignee' ? null : 'assignee')}
                className={`h-11 px-4 rounded-2xl flex items-center gap-2 transition-all group ${activeMenu === 'assignee' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <User size={16} className={isAssignPending ? 'animate-pulse' : ''} />
                <span className="text-[11px] font-black uppercase tracking-widest">Gán việc</span>
              </button>
              {activeMenu === 'assignee' && (
                <div className="absolute bottom-full mb-4 left-0 glass-panel p-1 rounded-2xl w-64 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-slate-800 rounded-xl overflow-hidden py-1">
                    <button
                      onClick={() => {
                        onBulkAssigneeIdChange('');
                        onApplyAssignee();
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/5 border-b border-white/5"
                    >
                      Bỏ gán tất cả
                    </button>
                    <div className="max-h-60 overflow-y-auto">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            onBulkAssigneeIdChange(m.id);
                            onApplyAssignee();
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${bulkAssigneeId === m.id ? 'text-brand-400 bg-brand-500/5' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {m.fullName.charAt(0)}
                          </div>
                          <span className="text-xs font-bold truncate">{m.fullName}</span>
                          {bulkAssigneeId === m.id && <Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* More Actions (Date, Type, Select All) */}
            <div className="relative ml-2 pl-2 border-l border-white/10 flex items-center gap-1">
              <button
                onClick={onToggleSelectAllVisible}
                className="h-11 w-11 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                title={selectedVisibleCount === totalVisibleCount ? 'Bỏ chọn hết' : 'Chọn hết'}
              >
                {selectedVisibleCount === totalVisibleCount ? (
                  <SquareCheck size={18} className="text-brand-500" />
                ) : (
                  <MousePointer2 size={18} />
                )}
              </button>

              <button
                onClick={onDeleteSelected}
                disabled={isDeletePending}
                className="h-11 w-11 rounded-2xl flex items-center justify-center text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all disabled:opacity-30"
                title="Xóa công việc"
              >
                {isDeletePending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Close Action */}
          <div className="pl-4 pr-2">
            <button
              onClick={onClearSelection}
              className="h-10 px-6 rounded-2xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
