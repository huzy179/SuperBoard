import { FormEventHandler } from 'react';

type ProjectFormProps = {
  mode: 'create' | 'edit';
  name: string;
  description: string;
  icon: string;
  color: string;
  error: string | null;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function ProjectForm({
  mode,
  name,
  description,
  icon,
  color,
  error,
  isPending,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onColorChange,
  onCancel,
  onSubmit,
}: ProjectFormProps) {
  const isCreate = mode === 'create';

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm"
    >
      {!isCreate ? (
        <p className="mb-3 text-sm font-semibold text-slate-800">Chỉnh sửa dự án</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Tên dự án
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={isCreate ? 'Ví dụ: Mobile App Revamp' : undefined}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Icon
          <input
            type="text"
            value={icon}
            onChange={(event) => onIconChange(event.target.value)}
            placeholder="📌"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Màu
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(event) => onColorChange(event.target.value)}
              className="h-9 w-9 shrink-0 rounded-lg border border-slate-300 p-0.5"
            />
            <input
              type="text"
              value={color}
              onChange={(event) => onColorChange(event.target.value)}
              placeholder="#2563eb"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </label>

        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Mô tả
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={3}
            placeholder={isCreate ? 'Mục tiêu hoặc phạm vi chính của dự án' : undefined}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending
            ? isCreate
              ? 'Đang tạo...'
              : 'Đang lưu...'
            : isCreate
              ? 'Tạo dự án'
              : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}
