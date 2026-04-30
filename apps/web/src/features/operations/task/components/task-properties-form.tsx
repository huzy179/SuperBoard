'use client';

import type { ProjectMemberDTO, ProjectTaskItemDTO, TaskTypeDTO } from '@superboard/shared';
import type { WorkflowStatusTemplateDTO } from '@superboard/shared';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { Calendar, Cpu, Flag, Target, User } from 'lucide-react';
import { LabelDots } from '@/features/operations/task/components/task-badges';
import {
  PRIORITY_OPTIONS,
  TASK_TYPE_ICONS,
  TASK_TYPE_OPTIONS,
  type TaskPriority,
} from '@/lib/constants/task';
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

  return (
    <div className="space-y-8">
      <FormField label="Tiêu đề">
        <div className="relative">
          <div className="absolute left-4 top-6 text-[color:var(--color-faint)] pointer-events-none">
            <Target size={16} />
          </div>
          <FormTextArea
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            rows={2}
            placeholder="Nhập tiêu đề công việc…"
            className="pl-11 text-lg font-semibold tracking-tight leading-snug resize-none"
          />
        </div>
      </FormField>

      <div className="space-y-3">
        <div className="text-xs font-medium text-[color:var(--color-muted)]">Loại công việc</div>
        <div className="flex flex-wrap gap-2">
          {TASK_TYPE_OPTIONS.map((t) => {
            const active = editType === t.key;
            const config = TASK_TYPE_ICONS[t.key] ?? TASK_TYPE_ICONS.task;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setEditType(t.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'bg-surface-card border-surface-border text-[color:var(--color-ink)] hover:bg-black/[0.02]'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${config.color}`}
                >
                  {config.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label="Trạng thái">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none">
              <ActivityDot />
            </div>
            <FormSelect
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="pl-11"
            >
              {statusOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </div>
        </FormField>

        <FormField label="Ưu tiên">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none">
              <Flag size={14} />
            </div>
            <FormSelect
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
              className="pl-11"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.key} value={priority.key}>
                  {priority.label}
                </option>
              ))}
            </FormSelect>
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FormField label="Story points">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none">
              <Cpu size={14} />
            </div>
            <FormInput
              type="number"
              min="0"
              max="100"
              value={editStoryPoints}
              onChange={(e) => setEditStoryPoints(e.target.value)}
              placeholder="—"
              className="pl-11"
            />
          </div>
        </FormField>

        <FormField label="Due date">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none">
              <Calendar size={14} />
            </div>
            <FormInput
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="pl-11"
            />
          </div>
        </FormField>

        <FormField label="Assignee">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none">
              <User size={14} />
            </div>
            <FormSelect
              value={editAssigneeId}
              onChange={(e) => setEditAssigneeId(e.target.value)}
              className="pl-11"
            >
              <option value="">Chưa giao</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </FormSelect>
          </div>

          {taskId && workspaceId ? (
            <div className="mt-4">
              <SmartAssigneeSuggestion
                taskId={taskId}
                workspaceId={workspaceId}
                onAssign={(id) => setEditAssigneeId(id)}
                currentAssigneeId={editAssigneeId}
              />
            </div>
          ) : null}
        </FormField>
      </div>

      {labels && labels.length > 0 ? (
        <div className="space-y-3 pt-6 border-t border-surface-border">
          <div className="text-xs font-medium text-[color:var(--color-muted)]">Labels</div>
          <LabelDots labels={labels} />
        </div>
      ) : null}
    </div>
  );
}

function ActivityDot() {
  return <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" aria-hidden />;
}
