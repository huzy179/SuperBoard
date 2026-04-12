'use client';

import { Dispatch, SetStateAction, useMemo } from 'react';
import { Type, Activity, Flag, Zap, Calendar, User } from 'lucide-react';
import type { ProjectTaskItemDTO, ProjectMemberDTO, TaskTypeDTO } from '@superboard/shared';
import { LabelDots } from '@/features/jira/components/task-badges';
import {
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';
import type { WorkflowStatusTemplateDTO } from '@superboard/shared';

interface TaskPropertiesFormProps {
  editTitle: string;
  setEditTitle: (val: string) => void;
  editType: TaskTypeDTO;
  setEditType: Dispatch<SetStateAction<TaskTypeDTO>>;
  editStatus: ProjectTaskItemDTO['status'];
  setEditStatus: (val: ProjectTaskItemDTO['status']) => void;
  editPriority: TaskPriority;
  setEditPriority: (val: TaskPriority) => void;
  editStoryPoints: string;
  setEditStoryPoints: (val: string) => void;
  editDueDate: string;
  setEditDueDate: (val: string) => void;
  editAssigneeId: string;
  setEditAssigneeId: (val: string) => void;
  members: ProjectMemberDTO[];
  labels?: ProjectTaskItemDTO['labels'];
  workflow?: WorkflowStatusTemplateDTO | undefined;
  initialStatus?: string;
}

export function TaskPropertiesForm({
  editTitle,
  setEditTitle,
  editType,
  setEditType,
  editStatus,
  setEditStatus,
  editPriority,
  setEditPriority,
  editStoryPoints,
  setEditStoryPoints,
  editDueDate,
  setEditDueDate,
  editAssigneeId,
  setEditAssigneeId,
  members,
  labels,
  workflow,
  initialStatus,
}: TaskPropertiesFormProps) {
  const statusOptions = useMemo(() => {
    if (!workflow || !initialStatus) {
      return (
        workflow?.statuses.map((s) => ({ key: s.key, label: s.name })) || [
          { key: 'todo', label: 'Cần làm' },
          { key: 'in_progress', label: 'Đang làm' },
          { key: 'in_review', label: 'Đang review' },
          { key: 'done', label: 'Hoàn thành' },
          { key: 'cancelled', label: 'Đã huỷ' },
        ]
      );
    }

    const currentStatusObj = workflow.statuses.find((s) => s.key === initialStatus);
    if (!currentStatusObj) return workflow.statuses.map((s) => ({ key: s.key, label: s.name }));

    const allowedToStatusIds = new Set(
      workflow.transitions
        .filter((t) => t.fromStatusId === currentStatusObj.id)
        .map((t) => t.toStatusId),
    );

    return workflow.statuses
      .filter((s) => s.key === initialStatus || allowedToStatusIds.has(s.id))
      .map((s) => ({ key: s.key, label: s.name }));
  }, [workflow, initialStatus]);

  const inputClasses =
    'mt-2 w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-white/20 appearance-none elite-scrollbar overflow-hidden';
  const labelClasses =
    'text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2 mb-1';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <label className="block">
          <span className={labelClasses}>
            <Zap size={10} className="text-brand-400" /> Identifier Mission Title
          </span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`${inputClasses} text-lg font-bold tracking-tight`}
            required
            placeholder="Mission designation..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <span className={labelClasses}>
            <Type size={10} className="text-indigo-400" /> Prototype Designation
          </span>
          <div className="flex flex-wrap gap-2 mt-3">
            {TASK_TYPE_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setEditType(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  editType === t.key
                    ? 'bg-brand-500 text-white shadow-luxe scale-105'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <span>{TASK_TYPE_ICONS[t.key].icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <label className="block">
              <span className={labelClasses}>
                <Activity size={10} className="text-emerald-400" /> Operational Status
              </span>
              <div className="relative">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={inputClasses}
                >
                  {statusOptions.map((opt: { key: string; label: string }) => (
                    <option key={opt.key} value={opt.key} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
                />
              </div>
            </label>
            <label className="block">
              <span className={labelClasses}>
                <Flag size={10} className="text-rose-400" /> Protocol Priority
              </span>
              <div className="relative">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className={inputClasses}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.key} value={priority.key} className="bg-slate-900">
                      {priority.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <label className="block">
          <span className={labelClasses}>
            <Zap size={10} className="text-brand-400" /> Complexity Points
          </span>
          <input
            type="number"
            min="0"
            max="100"
            value={editStoryPoints}
            onChange={(e) => setEditStoryPoints(e.target.value)}
            placeholder="—"
            className={inputClasses}
          />
        </label>
        <label className="block">
          <span className={labelClasses}>
            <Calendar size={10} className="text-blue-400" /> Termination Deadline
          </span>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="block">
          <span className={labelClasses}>
            <User size={10} className="text-orange-400" /> Designated Operative
          </span>
          <div className="relative">
            <select
              value={editAssigneeId}
              onChange={(e) => setEditAssigneeId(e.target.value)}
              className={inputClasses}
            >
              <option value="" className="bg-slate-900">
                -- Unassigned --
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900">
                  {m.fullName}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
            />
          </div>
        </label>
      </div>

      {labels && labels.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <span className={labelClasses}>Mission Classifications</span>
          <div className="flex flex-wrap gap-2">
            <LabelDots labels={labels} />
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDown({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
