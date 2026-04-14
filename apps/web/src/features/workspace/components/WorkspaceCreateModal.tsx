'use client';

import { FormEvent, useState } from 'react';
import { useCreateWorkspace } from '@/features/workspace/hooks/use-workspace-mutations';

interface WorkspaceCreateModalProps {
  onClose: () => void;
  onSuccess?: (workspaceId: string) => void;
}

export function WorkspaceCreateModal({ onClose, onSuccess }: WorkspaceCreateModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const createMutation = useCreateWorkspace();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      });
      onSuccess?.(result.id);
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Tạo Workspace mới</h2>
          <p className="mt-1 text-sm text-slate-500">
            Workspace là không gian làm việc chung cho team của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tên Workspace <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: TechViet Solutions"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              required
              autoFocus
              id="e2e-ws-name-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Đường dẫn (Slug - Tuỳ chọn)
            </label>
            <div className="flex items-center">
              <span className="inline-flex h-9 items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-xs text-slate-500">
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="tech-viet"
                className="w-full rounded-r-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                id="e2e-ws-slug-input"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-bold text-white shadow-md shadow-brand-100 transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              id="e2e-ws-submit-button"
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
