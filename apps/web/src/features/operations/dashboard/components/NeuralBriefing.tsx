'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cpu, Download, Box, Globe, HardDrive, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';

interface NeuralBriefingProps {
  projectId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NeuralBriefing({ projectId }: NeuralBriefingProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const toggleProvider = () => {
    setIsLocalMode(!isLocalMode);
    toast.success(
      isLocalMode ? 'Chuyển sang Neural Cloud (Gemini)' : 'Kích hoạt Local Node Failover (Ollama)',
    );
  };

  const handleExportDataset = async () => {
    setIsExporting(true);
    toast.info('Đang tổng hợp Dataset từ Neural Signals...');

    try {
      const { result } = await apiPost<any>(
        '/v1/ai/dataset/export',
        {
          format: 'llama3',
          limit: 1000,
        },
        { auth: true },
      );

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neural_signals_${new Date().toISOString().split('T')[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Dataset đã sẵn sàng để Fine-tune Llama!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Xuất Dataset thất bại');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--space-6)] p-[var(--space-4)]">
      {/* Strategic Command Intent */}
      <section className="lg:col-span-2 relative overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-luxe p-[var(--space-8)]">
        <div className="absolute top-6 right-6 opacity-[0.06]" aria-hidden>
          <Cpu size={96} />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Workspace briefing
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--color-ink)]">
            Điểm hội tụ tri thức{' '}
            <span className="text-[color:var(--color-focus)]">Jira · Docs · Chat</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-muted)]">
            Tóm tắt nhanh về tình trạng đồng bộ và những bước tiếp theo. Tập trung vào thông tin dễ
            đọc, ít hiệu ứng, đúng theo thiết kế Notion-inspired.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
            <div className="rounded-lg border border-surface-border bg-black/[0.02] p-[var(--space-5)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[color:var(--color-muted)]">Sync</p>
                <RefreshCcw size={14} className="text-[color:var(--color-faint)]" />
              </div>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-ink)]">
                3 briefings · 12 tasks · 14 contexts
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportDataset}
              disabled={isExporting}
              className="rounded-lg border border-surface-border bg-black/[0.02] p-[var(--space-5)] text-left hover:bg-black/[0.03] transition-colors disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[color:var(--color-muted)]">
                  Export dataset
                </p>
                {isExporting ? (
                  <RefreshCcw size={14} className="animate-spin text-[color:var(--color-muted)]" />
                ) : (
                  <Download size={14} className="text-[color:var(--color-muted)]" />
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-ink)]">
                JSONL (llama3) · 1,000 rows
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Operational Pulse & AI Control */}
      <div className="space-y-6">
        <section className="p-[var(--space-6)] bg-brand-50 border border-brand-200 rounded-card shadow-glass flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs font-medium text-brand-700 mb-1">Provider</div>
              <div className="text-lg font-semibold text-[color:var(--color-ink)]">
                {isLocalMode ? 'Local node' : 'Cloud'}
              </div>
            </div>
            <button
              onClick={toggleProvider}
              className="p-2 bg-white rounded-md hover:bg-black/[0.03] transition-colors border border-brand-200"
            >
              {isLocalMode ? (
                <HardDrive className="text-brand-700" size={16} />
              ) : (
                <Globe className="text-brand-700" size={16} />
              )}
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-[color:var(--color-muted)]">
              <span>Latency</span>
              <span className="font-medium text-[color:var(--color-ink)]">
                {isLocalMode ? '450ms' : '1.2s'}
              </span>
            </div>
            <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-brand-200">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: isLocalMode ? '90%' : '70%' }}
              />
            </div>
          </div>
        </section>

        <section className="p-[var(--space-6)] bg-surface-card border border-surface-border rounded-card shadow-glass flex flex-col items-center justify-center text-center gap-3 h-[110px]">
          <div className="h-10 w-10 rounded-full bg-black/[0.02] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)]">
            <Box size={18} />
          </div>
          <div>
            <div className="text-xs font-medium text-[color:var(--color-muted)] mb-0.5">
              Node integrity
            </div>
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">
              {isLocalMode ? 'Local: active' : 'Cloud: active'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
