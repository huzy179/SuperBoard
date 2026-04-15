import React from 'react';
import { Sparkles, Power, Zap, Activity, Cpu, Trash } from 'lucide-react';
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
      toast.success('Đã cập nhật trạng thái');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/automation/rules/${id}`, { auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Đã xóa rule');
    },
  });

  if (isLoading)
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <Activity className="h-8 w-8 text-brand-500/40 animate-pulse" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
          Đang tải rule...
        </span>
      </div>
    );

  return (
    <div className="space-y-6">
      {rules?.length === 0 ? (
        <div className="p-20 border-2 border-dashed border-white/5 rounded-[3rem] text-center bg-white/[0.01] group hover:border-brand-500/20 transition-all duration-700">
          <Sparkles className="mx-auto h-16 w-16 text-white/5 mb-6 group-hover:text-brand-500/20 group-hover:scale-110 transition-all" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            Không có automation nào
          </h3>
          <p className="text-[12px] text-white/20 mt-4 max-w-sm mx-auto font-medium leading-relaxed uppercase tracking-widest">
            Deploy AI Agents or synthesize manual rule-sets to optimize operational efficiency.
          </p>
        </div>
      ) : (
        rules?.map((rule) => {
          const actions = rule.actions as unknown as Array<{ type: string }>;
          return (
            <div
              key={rule.id}
              className={`relative overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500 flex items-center gap-10 group ${
                rule.isActive
                  ? 'bg-slate-900/60 border-brand-500/20 shadow-glow-brand/5'
                  : 'bg-white/[0.02] border-white/5 opacity-60 grayscale'
              }`}
            >
              {/* Luxury Background Detail */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/[0.02] blur-3xl rounded-full" />

              {/* Execution Flow Path */}
              <div className="absolute top-1/2 left-[120px] right-[120px] h-px bg-gradient-to-r from-brand-500/30 via-white/5 to-indigo-500/30 -translate-y-1/2" />

              {/* Trigger Hub */}
              <div className="relative z-10 flex flex-col items-center gap-4 min-w-[140px]">
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    rule.isActive
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-400 shadow-glow-brand/10'
                      : 'bg-white/5 border-white/10 text-white/20'
                  }`}
                >
                  <Zap size={28} className={rule.isActive ? 'animate-pulse' : ''} />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                    Kích hoạt
                  </span>
                  <p className="text-[11px] font-black text-white uppercase tracking-wider">
                    {rule.trigger.type}
                  </p>
                </div>
              </div>

              {/* Neural Transmission Bridge */}
              <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-20 group-hover:opacity-60 transition-opacity">
                <div className="flex gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-brand-500 animate-ping" />
                  <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]" />
                </div>
                <span className="text-[8px] font-black text-white uppercase tracking-[0.4em] font-mono">
                  Luồng hoạt động
                </span>
              </div>

              {/* Central Identity */}
              <div className="relative z-10 flex-1 max-w-[400px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px w-6 bg-brand-500/30" />
                  <h4 className="font-black text-lg text-white tracking-widest uppercase">
                    {rule.name}
                  </h4>
                </div>
                <p className="text-[12px] text-white/40 font-medium line-clamp-2 uppercase tracking-tight italic">
                  {rule.description || 'Tự động hóa đang hoạt động'}
                </p>
              </div>

              {/* Action Node */}
              <div className="relative z-10 flex flex-col items-center gap-4 min-w-[140px] ml-auto">
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    rule.isActive
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-glow-indigo/10'
                      : 'bg-white/5 border-white/10 text-white/20'
                  }`}
                >
                  <Cpu size={28} />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                    Hành động
                  </span>
                  <p className="text-[11px] font-black text-white uppercase tracking-wider">
                    {actions[0]?.type || 'EXECUTE'}
                  </p>
                </div>
              </div>

              {/* Command Controls */}
              <div className="flex flex-col gap-3 relative z-10 p-2 bg-black/40 rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <button
                  onClick={() => toggleMutation.mutate(rule)}
                  className={`p-3 rounded-xl transition-all relative group/icon ${
                    rule.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-white/20 border border-white/10 hover:text-white'
                  }`}
                  title={rule.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Power size={16} />
                </button>
                <div className="h-px w-full bg-white/5" />
                <button
                  onClick={() => deleteMutation.mutate(rule.id)}
                  className="p-3 bg-white/5 text-white/20 hover:text-rose-500 border border-white/5 hover:border-rose-500/30 rounded-xl transition-all"
                  title="Xóa rule"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
