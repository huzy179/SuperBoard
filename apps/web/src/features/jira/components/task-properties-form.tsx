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
    'mt-3 w-full rounded-[2.5rem] border border-white/5 bg-slate-950 px-8 py-5 text-sm font-bold text-white focus:outline-none focus:border-brand-500/40 focus:bg-white/[0.02] transition-all placeholder:text-white/5 shadow-inner appearance-none';
  const labelClasses =
    'text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-2 mb-1 pl-4';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="space-y-3">
        <label className="block">
          <span className={labelClasses}>
            <Target size={12} className="text-brand-400" /> Mission Designation
          </span>
          <textarea
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`${inputClasses} text-2xl font-black tracking-tighter uppercase leading-none resize-none elite-scrollbar`}
            rows={1}
            required
            placeholder="INPUT_MISSION_DESIGNATOR..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-4">
          <span className={labelClasses}>
            <Orbit size={12} className="text-indigo-400" /> Prototype Class
          </span>
          <div className="flex flex-wrap gap-3 mt-4">
            {TASK_TYPE_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setEditType(t.key)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border duration-500 ${
                  editType === t.key
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-glow-brand scale-105'
                    : 'bg-white/[0.03] border-white/5 text-white/20 hover:text-white/40 hover:bg-white/[0.05]'
                }`}
              >
                <div
                  className={`transition-transform duration-500 ${editType === t.key ? 'scale-110' : ''}`}
                >
                  {TASK_TYPE_ICONS[t.key].icon}
                </div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <label className="block">
            <span className={labelClasses}>
              <Activity size={12} className="text-emerald-400" /> Sync State
            </span>
            <div className="relative group">
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className={inputClasses}
              >
                {statusOptions.map((opt: { key: string; label: string }) => (
                  <option
                    key={opt.key}
                    value={opt.key}
                    className="bg-slate-900 font-bold uppercase tracking-widest text-[10px]"
                  >
                    {opt.label.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-brand-500 transition-colors">
                <ChevronDown size={14} />
              </div>
            </div>
          </label>
          <label className="block">
            <span className={labelClasses}>
              <Flag size={12} className="text-rose-400" /> Vector Urgency
            </span>
            <div className="relative group">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                className={inputClasses}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option
                    key={priority.key}
                    value={priority.key}
                    className="bg-slate-900 font-bold uppercase tracking-widest text-[10px]"
                  >
                    {priority.label.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-rose-500 transition-colors">
                <ChevronDown size={14} />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <label className="block">
          <span className={labelClasses}>
            <Cpu size={12} className="text-brand-400" /> Neural Complexity
          </span>
          <div className="relative group">
            <input
              type="number"
              min="0"
              max="100"
              value={editStoryPoints}
              onChange={(e) => setEditStoryPoints(e.target.value)}
              placeholder="—"
              className={inputClasses}
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/5 uppercase tracking-widest">
              CP_INDEX
            </span>
          </div>
        </label>
        <label className="block">
          <span className={labelClasses}>
            <Calendar size={12} className="text-blue-400" /> Termination
          </span>
          <div className="relative group">
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className={inputClasses}
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/5">
              <ShieldCheck size={14} />
            </div>
          </div>
        </label>
        <label className="block">
          <span className={labelClasses}>
            <User size={12} className="text-orange-400" /> Provisioned Op
          </span>
          <div className="relative group">
            <select
              value={editAssigneeId}
              onChange={(e) => setEditAssigneeId(e.target.value)}
              className={inputClasses}
            >
              <option value="" className="bg-slate-900">
                UNASSIGNED_OPERATOR
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900">
                  {m.fullName.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover:text-orange-500 transition-colors">
              <ChevronDown size={14} />
            </div>
          </div>
          {taskId && workspaceId && (
            <div className="mt-4 animate-in fade-in duration-500">
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
        <div className="space-y-6 pt-10 border-t border-white/5">
          <span className={labelClasses}>Classifications Vectors</span>
          <div className="flex flex-wrap gap-3">
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
