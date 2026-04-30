'use client';

import { useEffect, useState } from 'react';
import { Box, CheckSquare, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getProjects } from '@/features/operations/project/api/project-service';
import { apiPost } from '@/lib/api-client';
import type { Message, ProjectItemDTO } from '@superboard/shared';

interface MessageToTaskDialogProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageToTaskDialog({ message, isOpen, onClose }: MessageToTaskDialogProps) {
  const [projects, setProjects] = useState<ProjectItemDTO[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [title, setTitle] = useState(message.content.substring(0, 50));
  const [description, setDescription] = useState(
    `Nguồn: Tin nhắn từ ${message.author?.fullName}\n\n${message.content}`,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    Promise.resolve().then(() => setIsLoadingProjects(true));
    getProjects()
      .then((data: ProjectItemDTO[]) => {
        setProjects(data);
        if (data && data.length > 0) {
          const firstId = data[0]?.id;
          if (firstId) setSelectedProjectId(firstId);
        }
      })
      .catch(() => toast.error('Không thể tải danh sách dự án'))
      .finally(() => setIsLoadingProjects(false));
  }, [isOpen]);

  const handleCreateTask = async () => {
    if (!selectedProjectId) {
      toast.error('Vui lòng chọn một dự án');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost(
        `/v1/projects/${selectedProjectId}/tasks`,
        { title, description, status: 'todo', priority: 'medium' },
        { auth: true },
      );

      toast.success('Đã tạo task từ tin nhắn');
      onClose();
    } catch (error) {
      console.error('Failed to convert message to task:', error);
      toast.error('Không thể tạo task từ tin nhắn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Convert message to task"
    >
      <div className="modal-panel max-w-lg">
        <div className="modal-header">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
              <CheckSquare size={18} />
            </div>
            <div>
              <div className="modal-title">Tạo task từ tin nhắn</div>
              <div className="modal-subtitle">Chọn dự án và chỉnh sửa nhanh tiêu đề/mô tả.</div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-5">
          <div className="space-y-2">
            <label className="form-label">Dự án</label>
            {isLoadingProjects ? (
              <div className="h-10 w-full rounded-md bg-black/[0.06]" />
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="form-select"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="form-label">Tiêu đề</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea h-32"
            />
          </div>
        </div>

        <div className="modal-footer px-[var(--space-6)] pb-[var(--space-6)]">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={isSubmitting || isLoadingProjects}
            className="btn btn-primary flex-[2]"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Đang tạo…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Box size={16} />
                Tạo task
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
