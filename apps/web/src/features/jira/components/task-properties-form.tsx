'use client';

import { Dispatch, SetStateAction, useMemo } from 'react';
import { Activity, Flag, Calendar, User, Orbit, Target, ShieldCheck, Cpu } from 'lucide-react';
import type { ProjectTaskItemDTO, ProjectMemberDTO, TaskTypeDTO } from '@superboard/shared';
import { LabelDots } from '@/features/jira/components/task-badges';
import {
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';
import type { WorkflowStatusTemplateDTO } from '@superboard/shared';
import { SmartAssigneeSuggestion } from '@/features/talent/components/smart-assignee-suggestion';

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
    'mt-3 w-full rounded-[2.5rem] border border-white/5 bg-white/[0.01] px-10 py-5 text-sm font-black text-white/80 placeholder:text-white/5 focus:outline-none focus:border-brand-500/20 focus:bg-white/[0.03] transition-all duration-700 shadow-inner appearance-none backdrop-blur-[60px] italic tracking-tight uppercase';
  const labelClasses =
    'text-[10px] font-black text-white/10 uppercase tracking-[0.5em] flex items-center gap-4 mb-2 pl-6 italic';

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="space-y-4">
        <label className="block group/title">
          <span className={labelClasses}>
            <Target size={14} className="text-brand-500 group-hover/title:animate-pulse" /> Mission
            Designation
          </span>
          <textarea
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`${inputClasses} text-3xl font-black tracking-tighter uppercase leading-none resize-none elite-scrollbar py-8 h-auto min-h-[6rem] border-white/10 bg-white/[0.02] shadow-luxe focus:border-brand-500/30`}
            required
            rows={1}
            placeholder="INPUT_MISSION_DESIGNATOR..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
        <div className="space-y-6">
          <span className={labelClasses}>
            <Orbit
              size={14}
              className="text-indigo-400 group-hover:rotate-180 transition-transform duration-1000"
            />{' '}
            Prototype Class
          </span>
          <div className="flex flex-wrap gap-4 mt-6 px-1">
            {TASK_TYPE_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setEditType(t.key)}
                className={`flex items-center gap-4 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 border italic ${
                  editType === t.key
                    ? 'bg-brand-500 text-slate-900 border-brand-500 shadow-glow-brand/20 scale-110 z-10'
                    : 'bg-white/[0.01] border-white/5 text-white/20 hover:text-white/60 hover:bg-white/[0.03] hover:border-white/10'
                }`}
              >
                <div
                  className={`transition-all duration-700 ${editType === t.key ? 'scale-125' : 'opacity-30'}`}
                >
                  {TASK_TYPE_ICONS[t.key].icon}
                </div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10">
          <label className="block group/select">
            <span className={labelClasses}>
              <Activity
                size={14}
                className="text-emerald-500 group-hover/select:animate-spin-slow"
              />{' '}
              Sync State
            </span>
            <div className="relative group/field">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover/field:opacity-100 transition-opacity" />
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
              <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-emerald-500 transition-colors">
                <ChevronDown size={14} />
              </div>
            </div>
          </label>
          <label className="block group/select">
            <span className={labelClasses}>
              <Flag size={14} className="text-rose-500 group-hover/select:animate-bounce" /> Vector
              Urgency
            </span>
            <div className="relative group/field">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent opacity-0 group-hover/field:opacity-100 transition-opacity" />
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
              <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-rose-500 transition-colors">
                <ChevronDown size={14} />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <label className="block group/input">
          <span className={labelClasses}>
            <Cpu size={14} className="text-brand-400 group-hover/input:animate-pulse" /> Neural
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
            <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/10 uppercase tracking-[0.5em] pointer-events-none group-hover/field:text-brand-500 transition-colors">
              CP_IDX
            </span>
          </div>
        </label>
        <label className="block group/input">
          <span className={labelClasses}>
            <Calendar
              size={14}
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
            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-blue-500 transition-colors">
              <ShieldCheck size={18} />
            </div>
          </div>
        </label>
        <label className="block group/select">
          <span className={labelClasses}>
            <User
              size={14}
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
            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/field:text-orange-500 transition-colors">
              <ChevronDown size={14} />
            </div>
          </div>
          {taskId && workspaceId && (
            <div className="mt-8 animate-in fade-in duration-1000">
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
        <div className="space-y-8 pt-16 border-t border-white/5 bg-white/[0.005] rounded-[3rem] p-10 mt-6 border-dashed">
          <span className={labelClasses}>Classifications Vectors</span>
          <div className="flex flex-wrap gap-5 px-4">
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
