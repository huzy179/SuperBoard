'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
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
    <div className="modal-overlay p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-create-title"
        className="modal-panel max-w-md"
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 id="ws-create-title" className="modal-title">
              Tạo Workspace mới
            </h2>
            <p className="modal-subtitle">Không gian làm việc chung cho team của bạn.</p>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form id="ws-create-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Workspace name */}
            <div>
              <label htmlFor="ws-name-input" className="form-label">
                Tên Workspace{' '}
                <span className="text-rose-400 normal-case tracking-normal ml-0.5">*</span>
              </label>
              <input
                id="ws-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: TechViet Solutions"
                className="form-input"
                required
                autoFocus
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="ws-slug-input" className="form-label">
                Đường dẫn (Slug — Tuỳ chọn)
              </label>
              <div className="flex items-center rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden focus-within:border-brand-500/40 transition-all shadow-inner">
                <span className="px-4 text-white/20 text-sm font-mono select-none border-r border-white/8">
                  /
                </span>
                <input
                  id="ws-slug-input"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="tech-viet"
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Hủy
            </button>
            <button
              type="submit"
              form="ws-create-form"
              id="e2e-ws-submit-button"
              disabled={createMutation.isPending || !name.trim()}
              className="btn-primary flex-[2]"
            >
              {createMutation.isPending ? <Loader2 className="btn-spinner" /> : null}
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo Workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
