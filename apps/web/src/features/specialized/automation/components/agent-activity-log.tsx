'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bot,
  ChevronRight,
  Cpu,
  MessageSquare,
  RefreshCw,
  UserPlus,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAgentLogs, type AgentLog } from '../api/automation-service';

interface AgentActivityLogProps {
  workspaceId: string;
  projectId?: string;
}

export function AgentActivityLog({ workspaceId, projectId }: AgentActivityLogProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const body = await getAgentLogs(workspaceId, projectId);
      setLogs(body.logs);
    } catch (err) {
      console.error('Failed to fetch agent logs', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchLogs());
  }, [fetchLogs]);

  const stats = useMemo(() => {
    const decisions = logs.length;
    const activeAgents = 4;
    const overrideRate = '1.2%';
    return { decisions, activeAgents, overrideRate };
  }, [logs.length]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'AUTO_ASSIGN':
        return <UserPlus size={14} className="text-indigo-700" />;
      case 'POST_COMMENT':
        return <MessageSquare size={14} className="text-emerald-700" />;
      case 'UPDATE_STATUS':
        return <Zap size={14} className="text-amber-700" />;
      default:
        return <Cpu size={14} className="text-[color:var(--color-muted)]" />;
    }
  };

  return (
    <section className="rounded-xl border border-surface-border bg-surface-card shadow-luxe p-6 space-y-6 font-sans">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--color-ink)] tracking-tight">
              Nhật ký tác vụ Agent
            </h3>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              Các can thiệp tự động gần đây.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="btn btn-secondary px-3"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-black/[0.02] border border-surface-border">
          <div className="text-xs font-medium text-[color:var(--color-muted)]">Agent hoạt động</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--color-ink)]">
            {stats.activeAgents}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
          <div className="text-xs font-medium text-brand-700">Quyết định tự động</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--color-ink)]">
            {stats.decisions}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/[0.02] border border-surface-border">
          <div className="text-xs font-medium text-[color:var(--color-muted)]">Ghi đè thủ công</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--color-ink)]">
            {stats.overrideRate}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-[600px] overflow-auto scrollbar-hide pr-1">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="group flex flex-col gap-3 p-5 rounded-xl bg-surface-card border border-surface-border hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-black/[0.02] px-3 py-1 text-xs font-medium text-[color:var(--color-ink)]">
                    {getIcon(log.actionType)}
                    <span className="truncate">{log.actionType}</span>
                  </span>
                  <span className="text-xs text-[color:var(--color-muted)] truncate">
                    {log.agentName}
                  </span>
                </div>
                <span className="text-xs text-[color:var(--color-faint)] tabular-nums">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--color-muted)]">
                  <AlertCircle size={14} />
                  Lý do
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-ink)] leading-relaxed">
                  “{log.reason}”
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-border">
                <span className="text-xs text-[color:var(--color-muted)] tabular-nums">
                  Target: {log.targetId.slice(0, 8)}…
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
                >
                  Xem công việc <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-surface-border bg-black/[0.02] p-10 text-center">
            <Cpu size={36} className="mx-auto text-[color:var(--color-faint)]" />
            <p className="mt-3 text-sm font-medium text-[color:var(--color-muted)]">
              Chưa có hoạt động Agent.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
