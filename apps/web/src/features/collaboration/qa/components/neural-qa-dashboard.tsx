'use client';

import { useState, useMemo } from 'react';
import {
  Terminal,
  ShieldAlert,
  Activity,
  Zap,
  Bug,
  ChevronRight,
  Code,
  FileSearch,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { diagnoseManualIssue } from '../api/qa-service';

interface ErrorEvent {
  id: string;
  message: string;
  url: string;
  timestamp: string;
  severity: 'critical' | 'warning';
  stack?: string;
}

export function NeuralQaDashboard() {
  const [isDiagnosing, setIsDiagnosing] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);

  // Mock data for demo
  const errors: ErrorEvent[] = useMemo(
    () => [
      {
        id: '1',
        message: 'Cannot read property "id" of null',
        url: '/api/v1/projects/undefined/stats',
        timestamp: '2026-04-28T14:24:02Z',
        severity: 'critical',
        stack: 'TypeError: Cannot read property "id" of null at ProjectService.getStats...',
      },
      {
        id: '2',
        message: 'ECONNREFUSED 127.0.0.1:6379',
        url: '/api/v1/auth/login',
        timestamp: '2026-04-28T14:19:02Z',
        severity: 'warning',
      },
    ],
    [],
  );

  const handleDiagnose = async (error: ErrorEvent) => {
    setIsDiagnosing(error.id);
    try {
      const body = await diagnoseManualIssue({
        message: error.message,
        stack: error.stack || 'No stack trace available',
        url: error.url,
      });
      toast.success('Diagnosis Complete: A Troubleshooting Doc has been created.');
      setSelectedError({ ...error, message: body.diagnosis });
    } catch {
      toast.error('Diagnosis failed');
    } finally {
      setIsDiagnosing(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 bg-surface-bg font-sans min-h-screen text-[color:var(--color-ink)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <ShieldAlert size={32} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Trung tâm QA</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
              <span>Kiểm tra chất lượng và chẩn đoán lỗi</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
                Đang hoạt động
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/[0.02] border border-surface-border">
          <Activity size={16} className="text-[color:var(--color-muted)]" />
          <span className="text-sm font-medium text-[color:var(--color-ink)]">
            Tình trạng hệ thống: 98.4%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Error Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Luồng sự cố</h3>
            <button type="button" className="btn btn-secondary">
              <Terminal size={16} />
              Xóa bộ đệm
            </button>
          </div>

          <div className="space-y-4">
            {errors.map((error) => (
              <div
                key={error.id}
                onClick={() => setSelectedError(error)}
                className={`p-5 rounded-xl border transition-colors cursor-pointer select-none ${
                  selectedError?.id === error.id
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bug
                      size={16}
                      className={error.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'}
                    />
                    <span className="text-xs font-medium text-[color:var(--color-muted)]">
                      {error.severity === 'critical' ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                  <span className="text-xs text-[color:var(--color-faint)] tabular-nums">
                    14:24:02 UTC
                  </span>
                </div>
                <h4 className="text-base font-semibold text-[color:var(--color-ink)] mb-2 leading-tight">
                  {error.message}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-[color:var(--color-muted)]">
                  <ChevronRight size={12} /> {error.url}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="relative">
          {selectedError ? (
            <div className="p-6 rounded-xl bg-surface-card border border-surface-border shadow-luxe space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 text-brand-700">
                    <FileSearch size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--color-ink)] tracking-tight">
                      Chẩn đoán AI
                    </h3>
                    <p className="text-sm text-[color:var(--color-muted)]">
                      Tạo gợi ý xử lý và tài liệu khắc phục
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDiagnose(selectedError)}
                  disabled={!!isDiagnosing}
                  className="btn btn-primary"
                >
                  {isDiagnosing ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Zap size={14} />
                  )}
                  {isDiagnosing ? 'Đang quét...' : 'Tự sửa'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/[0.02] border border-surface-border font-mono text-xs text-[color:var(--color-muted)] leading-relaxed max-h-[400px] overflow-auto scrollbar-hide">
                {selectedError.stack ? (
                  <div className="space-y-4">
                    <div className="text-rose-700 font-semibold tracking-tight">Trace</div>
                    {selectedError.stack.split('\n').map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Code size={28} className="text-[color:var(--color-faint)]" />
                    <span className="text-sm text-[color:var(--color-muted)]">Chưa có stack</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 mb-2">
                    <CheckCircle2 size={14} />
                    <span className="text-sm font-semibold">Đề xuất sửa lỗi</span>
                  </div>
                  <p className="text-sm text-emerald-900 leading-relaxed">
                    Regression detected in ProjectService. Suggesting validation middleware
                    injection at line 142.
                  </p>
                </div>
                <button
                  type="button"
                  className="p-5 rounded-xl bg-surface-card border border-surface-border flex flex-col items-center justify-center text-center hover:bg-black/[0.02] transition-colors"
                >
                  <Code size={20} className="text-[color:var(--color-muted)] mb-2" />
                  <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                    Mở trong IDE
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-xl border border-surface-border bg-black/[0.02] p-10 text-center">
              <ShieldAlert size={48} className="text-[color:var(--color-faint)] mb-4" />
              <span className="text-sm font-medium text-[color:var(--color-muted)]">
                Chọn một sự cố để xem chi tiết.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
