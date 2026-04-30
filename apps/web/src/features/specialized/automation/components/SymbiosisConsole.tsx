'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Box,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { approveAutomationProposal, getAutomationProposals } from '../api/automation-service';

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
    getAutomationProposals(workspaceId).then((data) => {
      setProposals(data as Proposal[]);
      setIsLoading(false);
    });
  }, [workspaceId]);

  const handleApprove = async (id: string) => {
    setIsApproving(id);
    await approveAutomationProposal(id);
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
    <div className="space-y-8 py-8">
      <div className="flex items-start justify-between gap-6 px-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-lg border border-brand-200">
            <Layers className="h-5 w-5 text-brand-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[color:var(--color-ink)]">
              Gợi ý tự động hoá
            </h2>
            <p className="text-sm text-[color:var(--color-muted)]">
              Các đề xuất gộp/điều chỉnh workspace dựa trên tín hiệu hoạt động.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-black/[0.02] border border-surface-border rounded-full flex items-center gap-2">
          <Activity size={14} className="text-[color:var(--color-muted)]" />
          <span className="text-sm font-medium text-[color:var(--color-ink)]">
            {pendingCount} đang chờ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
        {proposals.map((proposal) => (
          <section
            key={proposal.id}
            className={`relative p-6 rounded-card border overflow-hidden ${
              proposal.metadata.status === 'APPROVED'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
            } transition-colors`}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    proposal.metadata.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  {proposal.actionType.replace('_', ' ')}
                </div>
                {proposal.metadata.status === 'APPROVED' && (
                  <CheckCircle2 size={16} className="text-emerald-700" />
                )}
              </div>
              <AlertTriangle size={16} className="text-[color:var(--color-faint)]" />
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-6">
                <div className="flex-1 p-4 bg-black/[0.02] rounded-lg border border-surface-border space-y-2">
                  <span className="text-xs font-medium text-[color:var(--color-muted)]">Nguồn</span>
                  <p className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                    {proposal.metadata.sourceProjectName}
                  </p>
                </div>
                <ArrowRight className="text-[color:var(--color-faint)]" size={16} />
                <div className="flex-1 p-4 bg-brand-50 rounded-lg border border-brand-200 space-y-2">
                  <span className="text-xs font-medium text-brand-700">Đích</span>
                  <p className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                    {proposal.metadata.targetProjectName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-[color:var(--color-muted)]">Lý do</span>
                <p className="text-sm text-[color:var(--color-ink)] leading-relaxed">
                  "{proposal.reason}"
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-surface-border">
              {proposal.metadata.status === 'PENDING' ? (
                <button
                  onClick={() => handleApprove(proposal.id)}
                  disabled={!!isApproving}
                  className="btn btn-primary w-full"
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
                <div className="w-full py-2 text-center text-sm font-medium text-emerald-800">
                  Đã áp dụng
                </div>
              )}
            </div>
          </section>
        ))}

        {proposals.length === 0 && (
          <div className="lg:col-span-2 py-40 flex flex-col items-center justify-center text-center space-y-4">
            <Box size={40} className="text-[color:var(--color-faint)]" />
            <p className="text-sm font-medium text-[color:var(--color-muted)]">
              Chưa có đề xuất nào.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsoleSkeleton() {
  return (
    <div className="space-y-8 py-8 px-6 animate-pulse">
      <div className="h-10 w-64 bg-black/[0.03] rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-80 bg-black/[0.03] rounded-card" />
        <div className="h-80 bg-black/[0.03] rounded-card" />
      </div>
    </div>
  );
}
