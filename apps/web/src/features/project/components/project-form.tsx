import { FormEventHandler } from 'react';
import { Sparkles, Edit3, Palette, X, Check, Files, Loader2 } from 'lucide-react';

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
      className="relative mb-10 rounded-[2rem] border border-white/8 bg-white/[0.02] p-10 shadow-inner backdrop-blur-3xl overflow-hidden"
    >
      {/* Color aura */}
      <div
        className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-15 transition-opacity duration-1000"
        style={{ backgroundColor: color || 'var(--color-brand-500)' }}
      />

      <div className="relative z-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isCreate ? 'Tạo dự án mới' : 'Chỉnh sửa dự án'}
            </h2>
            <p className="text-[11px] text-white/30 mt-1">
              {isCreate
                ? 'Điền thông tin để tạo dự án và bắt đầu làm việc.'
                : 'Cập nhật thông tin dự án của bạn.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 text-white/20 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Project name — full width */}
          <div className="md:col-span-2">
            <label className="form-label">
              <Edit3 size={10} />
              Tên dự án <span className="text-rose-400 normal-case tracking-normal ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={isCreate ? 'VD: SuperBoard v2, Marketing Q3...' : undefined}
              className="form-input"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="form-label">
              <Sparkles size={10} />
              Biểu tượng (Emoji)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                {icon || '🚀'}
              </div>
              <input
                type="text"
                value={icon}
                onChange={(event) => onIconChange(event.target.value)}
                placeholder="🚀"
                className="form-input pl-12"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="form-label">
              <Palette size={10} />
              Màu sắc
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2 pl-4 shadow-inner focus-within:border-brand-500/40 transition-all">
              <div
                className="h-8 w-8 rounded-xl flex-shrink-0 shadow-inner"
                style={{ backgroundColor: color || '#6366f1' }}
              />
              <input
                type="text"
                value={color}
                onChange={(event) => onColorChange(event.target.value)}
                placeholder="#6366F1"
                className="flex-1 bg-transparent border-none text-sm font-mono font-medium text-white placeholder:text-white/20 focus:ring-0 focus:outline-none uppercase"
              />
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10">
                <input
                  type="color"
                  value={color}
                  onChange={(event) => onColorChange(event.target.value)}
                  className="absolute -inset-2 h-14 w-14 cursor-pointer bg-transparent border-none opacity-0 z-10"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors pointer-events-none">
                  <Check size={13} className="text-white/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Description — full width */}
          <div className="md:col-span-2">
            <label className="form-label">
              <Files size={10} />
              Mô tả dự án
            </label>
            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={4}
              placeholder={isCreate ? 'Mô tả mục tiêu và phạm vi dự án...' : undefined}
              className="form-textarea"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Hủy
          </button>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? <Loader2 className="btn-spinner" /> : null}
            {isPending
              ? isCreate
                ? 'Đang tạo...'
                : 'Đang lưu...'
              : isCreate
                ? 'Tạo dự án'
                : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  );
}
