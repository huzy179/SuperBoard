'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Box,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';

interface Proposal {
  id: string;
  actionType: string;
  reason: string;
  metadata: {
    status: 'PENDING' | 'APPROVED';
    sourceProjectName: string;
    targetProjectName: string;
    overlapIntensity: number;
  };
}

export function SymbiosisConsole({ workspaceId }: { workspaceId: string }) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/automation/proposals?workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((res) => {
        setProposals(res.data);
        setIsLoading(false);
      });
  }, [workspaceId]);

  const handleApprove = async (id: string) => {
    setIsApproving(id);
    await fetch(`/api/v1/automation/proposals/${id}/approve`, { method: 'POST' });
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, metadata: { ...p.metadata, status: 'APPROVED' } } : p,
      ),
    );
    setIsApproving(null);
  };

  if (isLoading) return <ConsoleSkeleton />;

  const pendingCount = proposals.filter((p) => p.metadata.status === 'PENDING').length;

  return (
    <div className="space-y-12 py-10">
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20 shadow-glow-brand/10">
            <Layers className="h-5 w-5 text-brand-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              Bảng điều khiển tích hợp
            </h2>
            <p className="text-sm font-bold text-white uppercase tracking-tight italic">
              Gợi ý workspace từ AI
            </p>
          </div>
        </div>

        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
          <Activity size={14} className="text-brand-400" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
            {pendingCount} chỉ đang chờ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
        <AnimatePresence mode="popLayout">
          {proposals.map((proposal, idx) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-700 overflow-hidden ${
                proposal.metadata.status === 'APPROVED'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-slate-900/50 border-white/10 hover:border-brand-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      proposal.metadata.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-brand-500/20 text-brand-400'
                    }`}
                  >
                    {proposal.actionType.replace('_', ' ')}
                  </div>
                  {proposal.metadata.status === 'APPROVED' && (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  )}
                </div>
                <AlertTriangle size={14} className="text-white/20" />
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-6">
                  <div className="flex-1 p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Nguồn
                    </span>
                    <p className="text-[11px] font-bold text-white truncate uppercase tracking-tight">
                      {proposal.metadata.sourceProjectName}
                    </p>
                  </div>
                  <ArrowRight className="text-white/20" />
                  <div className="flex-1 p-5 bg-brand-500/5 rounded-2xl border border-brand-500/10 space-y-2">
                    <span className="text-[8px] font-black text-brand-400/40 uppercase tracking-widest">
                      Đích
                    </span>
                    <p className="text-[11px] font-bold text-white truncate uppercase tracking-tight">
                      {proposal.metadata.targetProjectName}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                    Cơ sở đề xuất
                  </span>
                  <p className="text-sm font-bold text-white/60 italic leading-relaxed">
                    "{proposal.reason}"
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                {proposal.metadata.status === 'PENDING' ? (
                  <button
                    onClick={() => handleApprove(proposal.id)}
                    disabled={!!isApproving}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-brand-500 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-glow-brand hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isApproving === proposal.id ? (
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Fingerprint size={16} /> Áp dụng
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-5 text-center text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">
                    Đã áp dụng chiến lược
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {proposals.length === 0 && (
          <div className="lg:col-span-2 py-40 flex flex-col items-center justify-center text-center space-y-4">
            <Box size={40} className="text-white/10" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              Chưa có đề xuất nào
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsoleSkeleton() {
  return (
    <div className="space-y-12 py-10 px-6 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-white/5 rounded-[3.5rem]" />
        <div className="h-96 bg-white/5 rounded-[3.5rem]" />
      </div>
    </div>
  );
}
