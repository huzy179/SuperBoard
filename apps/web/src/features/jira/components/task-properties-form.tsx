'use client';

import { Dispatch, SetStateAction, useMemo } from 'react';
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
      // Fallback to default columns if no workflow
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
    <div className="space-y-5">
      <label className="block text-sm font-medium text-slate-700">
        Tiêu đề
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          required
        />
      </label>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Loại task</p>
        <div className="flex gap-1">
          {TASK_TYPE_OPTIONS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setEditType(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                editType === t.key
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm">{TASK_TYPE_ICONS[t.key].icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Trạng thái
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          >
            {statusOptions.map((opt: { key: string; label: string }) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Độ ưu tiên
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority.key} value={priority.key}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Story Points
          <input
            type="number"
            min="0"
            max="100"
            value={editStoryPoints}
            onChange={(e) => setEditStoryPoints(e.target.value)}
            placeholder="—"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Hạn hoàn thành
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Người thực hiện
        <select
          value={editAssigneeId}
          onChange={(e) => setEditAssigneeId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
        >
          <option value="">-- Chưa gán --</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>
      </label>

      {labels && labels.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Nhãn</p>
          <LabelDots labels={labels} />
        </div>
      ) : null}
    </div>
  );
}
