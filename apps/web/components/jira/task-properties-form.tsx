'use client';

import { Dispatch, SetStateAction } from 'react';
import type { ProjectTaskItemDTO, ProjectMemberDTO, TaskTypeDTO } from '@superboard/shared';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';

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
}: TaskPropertiesFormProps) {
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
            onChange={(e) => setEditStatus(e.target.value as ProjectTaskItemDTO['status'])}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-brand-500"
          >
            {BOARD_COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
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
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Nhãn</p>
          <div className="flex gap-1 flex-wrap">
            {labels.map((label) => (
              <span
                key={label.id}
                className="inline-flex h-2 w-2 rounded-full bg-slate-300"
                title={label.name}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
