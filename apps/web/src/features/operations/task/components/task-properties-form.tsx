'use client';

import { Dispatch, SetStateAction, useMemo } from 'react';
import { Activity, Flag, Calendar, User, Orbit, Target, ShieldCheck, Cpu } from 'lucide-react';
import type { ProjectTaskItemDTO, ProjectMemberDTO, TaskTypeDTO } from '@superboard/shared';
import { LabelDots } from '@/features/operations/task/components/task-badges';
import {
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';
import type { WorkflowStatusTemplateDTO } from '@superboard/shared';
import { SmartAssigneeSuggestion } from '@/features/specialized/talent/components/smart-assignee-suggestion';

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
  taskId?: string;
  workspaceId?: string;
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
  taskId,
  workspaceId,
  labels,
  workflow,
  initialStatus,
}: TaskPropertiesFormProps) {
  const statusOptions = useMemo(() => {
    if (!workflow || !initialStatus) {
      return (
        workflow?.statuses.map((s) => ({ key: s.key, label: s.name })) || [
          { key: 'todo', label: 'TODO' },
          { key: 'in_progress', label: 'IN_PROGRESS' },
          { key: 'in_review', label: 'IN_REVIEW' },
          { key: 'done', label: 'DONE' },
          { key: 'cancelled', label: 'CANCELLED' },
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
    'mt-2 w-full rounded-sm border border-white/5 bg-white/[0.01] px-var(--space-4) py-var(--space-3) text-sm font-bold text-white/70 placeholder:text-white/5 focus:outline-none focus:border-brand-500/20 focus:bg-white/[0.02] transition-all duration-300 shadow-inner appearance-none backdrop-blur-xl tracking-tight';
  const labelClasses =
    'text-[10px] font-black text-white/10 uppercase tracking-[0.4em] flex items-center gap-3 mb-1.5 pl-2';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="space-y-3">
        <label className="block group/title">
          <span className={labelClasses}>
            <Target size={12} className="text-brand-500 group-hover/title:animate-pulse" /> Mission
            Designation
          </span>
          <textarea
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`${inputClasses} text-2xl font-black tracking-tight uppercase leading-none resize-none elite-scrollbar py-6 h-auto min-h-[5rem] border-white/10 bg-white/[0.02] shadow-luxe focus:border-brand-500/30`}
            required
            rows={1}
            placeholder="INPUT_MISSION_DESIGNATOR..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-4">
          <span className={labelClasses}>
            <Orbit
              size={12}
              className="text-indigo-400 group-hover:rotate-180 transition-transform duration-1000"
            />{' '}
            Prototype Class
          </span>
          <div className="flex flex-wrap gap-3 mt-4 px-1">
            {TASK_TYPE_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setEditType(t.key)}
                className={`flex items-center gap-3 px-var(--space-4) py-var(--space-2) rounded-xs text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border ${
                  editType === t.key
                    ? 'bg-brand-500 text-slate-950 border-brand-500 shadow-glow-brand/10'
                    : 'bg-white/[0.01] border-white/5 text-white/20 hover:text-white/60 hover:bg-white/[0.03] hover:border-white/10'
                }`}
              >
                <div
                  className={`transition-all duration-300 ${editType === t.key ? 'scale-110' : 'opacity-30'}`}
                >
                  {TASK_TYPE_ICONS[t.key].icon}
                </div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <label className="block group/select">
            <span className={labelClasses}>
              <Activity
                size={12}
                className="text-emerald-500 group-hover/select:animate-spin-slow"
              />{' '}
              Sync State
            </span>
            <div className="relative group/field">
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className={inputClasses}
              >
                {statusOptions.map((opt: { key: string; label: string }) => (
                  <option
                    key={opt.key}
                    value={opt.key}
                    className="bg-slate-950 font-black uppercase text-xs tracking-widest p-4"
                  >
                    {opt.label.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-emerald-500 transition-colors">
                <ChevronDown size={12} />
              </div>
            </div>
          </label>
          <label className="block group/select">
            <span className={labelClasses}>
              <Flag size={12} className="text-rose-500 group-hover/select:animate-bounce" /> Vector
              Urgency
            </span>
            <div className="relative group/field">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                className={inputClasses}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option
                    key={priority.key}
                    value={priority.key}
                    className="bg-slate-950 font-black uppercase text-xs tracking-widest p-4"
                  >
                    {priority.label.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-rose-500 transition-colors">
                <ChevronDown size={12} />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <label className="block group/input">
          <span className={labelClasses}>
            <Cpu size={12} className="text-brand-400 group-hover/input:animate-pulse" /> Neural
            Complexity
          </span>
          <div className="relative group/field">
            <input
              type="number"
              min="0"
              max="100"
              value={editStoryPoints}
              onChange={(e) => setEditStoryPoints(e.target.value)}
              placeholder="—"
              className={inputClasses}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/10 uppercase tracking-[0.3em] pointer-events-none group-hover/field:text-brand-500 transition-colors">
              CP_IDX
            </span>
          </div>
        </label>
        <label className="block group/input">
          <span className={labelClasses}>
            <Calendar
              size={12}
              className="text-blue-400 group-hover/input:scale-110 transition-transform"
            />{' '}
            Termination
          </span>
          <div className="relative group/field">
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className={`${inputClasses} [color-scheme:dark]`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-blue-500 transition-colors">
              <ShieldCheck size={14} />
            </div>
          </div>
        </label>
        <label className="block group/select">
          <span className={labelClasses}>
            <User
              size={12}
              className="text-orange-500 group-hover/select:translate-x-1 transition-transform"
            />{' '}
            Provisioned Op
          </span>
          <div className="relative group/field">
            <select
              value={editAssigneeId}
              onChange={(e) => setEditAssigneeId(e.target.value)}
              className={inputClasses}
            >
              <option value="" className="bg-slate-950 font-black uppercase tracking-widest">
                UNASSIGNED_OPERATOR
              </option>
              {members.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  className="bg-slate-950 font-black uppercase tracking-widest"
                >
                  {m.fullName.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-orange-500 transition-colors">
              <ChevronDown size={12} />
            </div>
          </div>
          {taskId && workspaceId && (
            <div className="mt-6 animate-in fade-in duration-1000">
              <SmartAssigneeSuggestion
                taskId={taskId}
                workspaceId={workspaceId}
                onAssign={(id) => setEditAssigneeId(id)}
                currentAssigneeId={editAssigneeId}
              />
            </div>
          )}
        </label>
      </div>

      {labels && labels.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-white/5 bg-white/[0.005] rounded-md p-var(--space-6) mt-4 border-dashed">
          <span className={labelClasses}>Classifications Vectors</span>
          <div className="flex flex-wrap gap-4 px-2">
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
