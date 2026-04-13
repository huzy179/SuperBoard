'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  History,
  ChevronRight,
  Cpu,
  UserPlus,
  MessageSquare,
  AlertCircle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentLog {
  id: string;
  agentName: string;
  actionType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}

interface AgentActivityLogProps {
  workspaceId: string;
  projectId?: string;
}

export function AgentActivityLog({ workspaceId, projectId }: AgentActivityLogProps) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [workspaceId, projectId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const url = `/api/v1/automation/agents/logs?workspaceId=${workspaceId}${projectId ? `&projectId=${projectId}` : ''}`;
      const res = await fetch(url);
      const body = await res.json();
      if (res.ok) {
        setLogs(body.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch agent logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'AUTO_ASSIGN':
        return <UserPlus size={14} className="text-indigo-400" />;
      case 'POST_COMMENT':
        return <MessageSquare size={14} className="text-emerald-400" />;
      case 'UPDATE_STATUS':
        return <Zap size={14} className="text-amber-400" />;
      default:
        return <Cpu size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 p-10 bg-black/40 rounded-[3rem] border border-white/5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
              Agency Audit Log
            </h3>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mt-1">
              Autonomous Interventions
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
            Active Agents
          </span>
          <span className="text-2xl font-black text-white tabular-nums">04</span>
        </div>
        <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-2 shadow-glow-indigo">
          <span className="text-[9px] font-black text-indigo-400/40 uppercase tracking-widest">
            Autonomous Decisions
          </span>
          <span className="text-2xl font-black text-indigo-400 tabular-nums">{logs.length}</span>
        </div>
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2 text-white/20">
          <span className="text-[9px] font-black uppercase tracking-widest">
            Human Override Rate
          </span>
          <span className="text-2xl font-black tabular-nums">1.2%</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-h-[600px] overflow-auto scrollbar-hide pr-2">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="group flex flex-col gap-4 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    {getIcon(log.actionType)}
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {log.actionType}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {log.agentName}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-white/20 uppercase tabular-nums">
                  {formatDistanceToNow(new Date(log.createdAt))} ago
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <AlertCircle size={12} className="text-indigo-400/60" />
                  <span className="text-[10px] font-black uppercase tracking-tighter italic">
                    Reasoning Output
                  </span>
                </div>
                <p className="text-[11px] font-medium text-white/40 leading-relaxed italic border-l-2 border-indigo-500/20 pl-4 py-1">
                  "{log.reason}"
                </p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Zap size={10} />
                  </div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                    Target Entity: {log.targetId.slice(0, 8)}...
                  </span>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black text-indigo-400/60 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                  View Mission <ChevronRight size={10} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-60 flex flex-col items-center justify-center opacity-20 filter grayscale gap-4">
            <History size={48} className="text-white/10" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.5em]">
              No Agent Activity Detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
