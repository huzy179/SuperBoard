import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateRuleModalProps {
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export function CreateRuleModal({ workspaceId, projectId, onClose }: CreateRuleModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('TASK_CREATED');
  const [actionMessage, setActionMessage] = useState('Task {{taskId}} notification!');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/automation/rules?workspaceId=${workspaceId}`, data, { auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Đã tạo quy tắc thành công');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-brand-500" />
            <h3 className="font-black text-slate-800 uppercase tracking-tight">
              Tạo quy tắc tự động hóa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Tên quy tắc
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thông báo khi có task mới"
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Khi (Trigger)
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all font-medium appearance-none"
              >
                <option value="TASK_CREATED">Task được tạo</option>
                <option value="STATUS_CHANGED">Trạng thái thay đổi</option>
                <option value="ASSIGNEE_CHANGED">Người nhận thay đổi</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Thì (Action)
              </label>
              <div className="w-full px-4 py-3 bg-slate-100/50 border-none rounded-2xl font-black text-slate-400 text-sm">
                Gửi thông báo
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Nội dung thông báo
            </label>
            <textarea
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all font-medium min-h-[100px]"
            />
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-1">
              <AlertCircle size={12} />
              <span>
                Dùng &#123;&#123;taskId&#125;&#125; hoặc &#123;&#123;type&#125;&#125; để chèn giá
                trị động.
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
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
