'use client';

import { useState, useEffect } from 'react';
import { Sparkles, UserPlus, Check, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { getTaskAssigneeSuggestions } from '../api/talent-service';

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
        const data = await getTaskAssigneeSuggestions(taskId, workspaceId);
        setSuggestions(data.suggestions);
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
      <div className="space-y-3">
        <div className="h-4 w-32 bg-black/[0.06] rounded" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-black/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[color:var(--color-muted)] flex items-center gap-2">
          <Sparkles size={14} className="text-brand-600" />
          Gợi ý từ AI
        </label>
      </div>

      <div className="grid gap-2">
        {suggestions.map((user) => (
          <div
            key={user.id}
            onClick={() => onAssign(user.id)}
            className={`
              group relative p-3 rounded-lg border transition-colors cursor-pointer
              ${
                currentAssigneeId === user.id
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-black/[0.04] border border-surface-border flex items-center justify-center text-[11px] font-semibold text-[color:var(--color-ink)]">
                  {getInitials(user.fullName)}
                </div>
                {user.score > 20 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-surface-card flex items-center justify-center">
                    <Sparkles size={8} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                    {user.fullName}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      user.score > 10 ? 'text-indigo-700' : 'text-[color:var(--color-muted)]'
                    }`}
                  >
                    {Math.max(0, user.score)}% match
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                  {user.workload > 5 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1">
                      <Activity size={12} /> Bận
                    </span>
                  )}
                  {user.skills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-full bg-black/[0.02] border border-surface-border text-[color:var(--color-muted)] text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {currentAssigneeId === user.id ? (
                  <Check size={16} className="text-emerald-700" />
                ) : (
                  <UserPlus size={16} className="text-[color:var(--color-muted)]" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
