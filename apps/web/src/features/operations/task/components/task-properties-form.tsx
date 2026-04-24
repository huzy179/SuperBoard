'use client';

import { Dispatch, SetStateAction, useMemo } from 'react';
import { Activity, Flag, Calendar, User, Orbit, Target, Cpu } from 'lucide-react';

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
import { FormField, FormInput, FormSelect, FormTextArea } from '@/components/ui/form-controls';

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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="space-y-3">
        <FormField label="Mission Designation">
          <div className="relative group/title">
            <div className="absolute left-4 top-6 text-brand-500 group-hover/title:animate-pulse z-10 pointer-events-none">
              <Target size={18} />
            </div>
            <FormTextArea
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-2xl font-black tracking-tight uppercase leading-none resize-none elite-scrollbar py-6 pl-12 min-h-[5rem] border-white/10 bg-white/[0.02] shadow-luxe focus:border-brand-500/30"
              required
              rows={1}
              placeholder="INPUT_MISSION_DESIGNATOR..."
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] flex items-center gap-3 mb-1.5 pl-2">
            <Orbit
              size={12}
              className="text-indigo-400 group-hover:rotate-180 transition-transform duration-1000"
            />{' '}
            Prototype Class
          </label>
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
          <FormField label="Sync State">
            <div className="relative group/field">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 group-hover/field:animate-spin-slow z-10 pointer-events-none">
                <Activity size={14} />
              </div>
              <FormSelect
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="pl-12"
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
              </FormSelect>
            </div>
          </FormField>

          <FormField label="Vector Urgency">
            <div className="relative group/field">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 group-hover/field:animate-bounce z-10 pointer-events-none">
                <Flag size={14} />
              </div>
              <FormSelect
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                className="pl-12"
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
              </FormSelect>
            </div>
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FormField label="Neural Complexity">
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 group-hover/field:animate-pulse z-10 pointer-events-none">
              <Cpu size={14} />
            </div>
            <FormInput
              type="number"
              min="0"
              max="100"
              value={editStoryPoints}
              onChange={(e) => setEditStoryPoints(e.target.value)}
              placeholder="—"
              className="pl-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/10 uppercase tracking-[0.3em] pointer-events-none group-hover/field:text-brand-500 transition-colors">
              CP_IDX
            </span>
          </div>
        </FormField>

        <FormField label="Termination">
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover/field:scale-110 transition-transform z-10 pointer-events-none">
              <Calendar size={14} />
            </div>
            <FormInput
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="pl-12 [color-scheme:dark]"
            />
          </div>
        </FormField>

        <FormField label="Provisioned Op">
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 group-hover/field:translate-x-1 transition-transform z-10 pointer-events-none">
              <User size={14} />
            </div>
            <FormSelect
              value={editAssigneeId}
              onChange={(e) => setEditAssigneeId(e.target.value)}
              className="pl-12"
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
            </FormSelect>
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
        </FormField>
      </div>

      {labels && labels.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-white/5 bg-white/[0.005] rounded-md p-var(--space-6) mt-4 border-dashed">
          <label className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] flex items-center gap-3 mb-1.5 pl-2">
            Classifications Vectors
          </label>
          <div className="flex flex-wrap gap-4 px-2">
            <LabelDots labels={labels} />
          </div>
        </div>
      )}
    </div>
  );
}
