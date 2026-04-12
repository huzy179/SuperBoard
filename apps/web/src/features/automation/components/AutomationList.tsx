import React from 'react';
import { Sparkles, Trash2, Power } from 'lucide-react';
import { apiGet, apiPut, apiDelete } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { WorkflowRuleDTO } from '@superboard/shared';

interface AutomationListProps {
  workspaceId: string;
  projectId?: string;
}

export function AutomationList({ workspaceId, projectId }: AutomationListProps) {
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery<WorkflowRuleDTO[]>({
    queryKey: ['automation-rules', workspaceId, projectId],
    queryFn: () => {
      const url = `/automation/rules?workspaceId=${workspaceId}${projectId ? `&projectId=${projectId}` : ''}`;
      return apiGet<WorkflowRuleDTO[]>(url, { auth: true });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: WorkflowRuleDTO) =>
      apiPut(`/automation/rules/${rule.id}`, { isActive: !rule.isActive }, { auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Đã cập nhật trạng thái tự động hóa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/automation/rules/${id}`, { auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Đã xóa quy tắc');
    },
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Đang tải...</div>;

  return (
    <div className="space-y-4">
      {rules?.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
          <Sparkles className="mx-auto h-12 w-12 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Chưa có tự động hóa nào</h3>
          <p className="text-sm text-slate-500 mt-2">
            Dùng AI trợ giúp hoặc tự tạo các quy tắc để tăng năng suất.
          </p>
        </div>
      ) : (
        rules?.map((rule) => (
          <div
            key={rule.id}
            className="premium-card p-6 flex items-center justify-between group h-32 relative overflow-hidden"
          >
            {/* Visual Flow Background Line */}
            <div className="absolute top-1/2 left-24 right-24 h-[2px] bg-slate-100 -translate-y-1/2 z-0" />

            <div className="flex items-center gap-8 relative z-10 w-full pr-24">
              {/* Trigger Part */}
              <div className="flex flex-col items-center gap-2 min-w-[100px]">
                <div
                  className={`p-4 rounded-2xl shadow-sm ${rule.isActive ? 'bg-brand-500 text-white shadow-brand-500/20' : 'bg-slate-100 text-slate-400'}`}
                >
                  <Sparkles size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {rule.trigger.type}
                </span>
              </div>

              {/* Connector Detail */}
              <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-40">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>

              {/* Info Part */}
              <div className="flex flex-col justify-center max-w-[300px]">
                <h4 className="font-black text-slate-900 leading-tight mb-1">{rule.name}</h4>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  {rule.description || 'Quy tắc tự động hóa hệ thống'}
                </p>
              </div>

              {/* Action Part */}
              <div className="flex flex-col items-center gap-2 min-w-[100px] ml-auto">
                <div
                  className={`p-4 rounded-2xl border-2 ${rule.isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
                >
                  <Sparkles size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {(rule.actions as unknown as Array<{ type: string }>)[0]?.type || 'ACTION'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 relative z-10 ml-4">
              <button
                onClick={() => toggleMutation.mutate(rule)}
                className={`p-3 rounded-xl transition-all shadow-sm active:scale-90 ${rule.isActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}
              >
                <Power size={18} />
              </button>
              <button
                onClick={() => deleteMutation.mutate(rule.id)}
                className="p-3 bg-white text-rose-500 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
