'use client';

import { useState, useEffect } from 'react';
import { Sparkles, UserPlus, Check, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/helpers';

interface Suggestion {
  id: string;
  fullName: string;
  score: number;
  workload: number;
  skills: string[];
}

interface SmartAssigneeSuggestionProps {
  taskId: string;
  workspaceId: string;
  onAssign: (userId: string) => void;
  currentAssigneeId?: string | null;
}

export function SmartAssigneeSuggestion({
  taskId,
  workspaceId,
  onAssign,
  currentAssigneeId,
}: SmartAssigneeSuggestionProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/v1/talent/tasks/${taskId}/suggestions?workspaceId=${workspaceId}`,
        );
        const data = await res.json();
        setSuggestions(data.data.suggestions);
      } catch {
        toast.error('Lỗi khi gợi ý nhân sự');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [taskId, workspaceId]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={12} className="animate-pulse" />
          AI Recommended
        </label>
      </div>

      <div className="grid gap-2">
        {suggestions.map((user) => (
          <div
            key={user.id}
            onClick={() => onAssign(user.id)}
            className={`
              group relative p-3 rounded-2xl border transition-all cursor-pointer
              ${
                currentAssigneeId === user.id
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-white uppercase italic">
                  {getInitials(user.fullName)}
                </div>
                {user.score > 20 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center">
                    <Zap size={6} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                    {user.fullName}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest ${user.score > 10 ? 'text-indigo-400' : 'text-white/20'}`}
                  >
                    {Math.max(0, user.score)}% Match
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                  {user.workload > 5 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-tighter flex items-center gap-1">
                      <Activity size={8} /> Busy
                    </span>
                  )}
                  {user.skills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 text-[8px] font-black uppercase tracking-tighter"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {currentAssigneeId === user.id ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <UserPlus size={14} className="text-white/40" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Zap({ size, className }: { size: number; className?: string }) {
  return <Sparkles size={size} className={className} />;
}
