import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { useCreateAutomationRule } from '../hooks/use-automation-rules';

interface CreateRuleModalProps {
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export function CreateRuleModal({ workspaceId, projectId, onClose }: CreateRuleModalProps) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('TASK_CREATED');
  const [actionMessage, setActionMessage] = useState('Task {{taskId}} notification!');

  const createMutation = useCreateAutomationRule(workspaceId, projectId);
  const handleSuccess = () => {
    onClose();
  };

  const createRule = (payload: Record<string, unknown>) =>
    createMutation.mutate(payload, {
      onSuccess: handleSuccess,
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRule({
      name,
      workspaceId,
      projectId,
      trigger: { type: triggerType },
      actions: [
        {
          type: 'SEND_NOTIFICATION',
          config: { message: actionMessage },
        },
      ],
    });
  };

  return (
    <div className="modal-overlay p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Tạo quy tắc tự động hoá</h3>
            <p className="modal-subtitle">Thiết lập trigger và hành động cơ bản.</p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-6">
          <div className="space-y-2">
            <label className="form-label">
              <Sparkles size={11} />
              Tên quy tắc
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thông báo khi có task mới"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="form-label">Khi (Trigger)</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="form-select"
              >
                <option value="TASK_CREATED">Task được tạo</option>
                <option value="STATUS_CHANGED">Trạng thái thay đổi</option>
                <option value="ASSIGNEE_CHANGED">Người nhận thay đổi</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="form-label">Thì (Action)</label>
              <div className="w-full px-4 py-3 bg-black/[0.02] border border-surface-border rounded-sm font-medium text-[color:var(--color-muted)] text-sm">
                Gửi thông báo
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="form-label">Nội dung thông báo</label>
            <textarea
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              className="form-textarea min-h-[110px]"
            />
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] font-medium px-1">
              <AlertCircle size={12} />
              <span>
                Dùng &#123;&#123;taskId&#125;&#125; hoặc &#123;&#123;type&#125;&#125; để chèn giá
                trị động.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary flex-[2]"
            >
              {createMutation.isPending ? (
                'Đang tạo...'
              ) : (
                <>
                  <Plus size={18} />
                  <span>Kích hoạt tự động hóa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
