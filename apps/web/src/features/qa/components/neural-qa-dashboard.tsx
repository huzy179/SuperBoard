'use client';

import { useState } from 'react';
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
  const errors: ErrorEvent[] = [
    {
      id: '1',
      message: 'Cannot read property "id" of null',
      url: '/api/v1/projects/undefined/stats',
      timestamp: new Date().toISOString(),
      severity: 'critical',
      stack: 'TypeError: Cannot read property "id" of null at ProjectService.getStats...',
    },
    {
      id: '2',
      message: 'ECONNREFUSED 127.0.0.1:6379',
      url: '/api/v1/auth/login',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      severity: 'warning',
    },
  ];

  const handleDiagnose = async (error: ErrorEvent) => {
    setIsDiagnosing(error.id);
    try {
      const res = await fetch('/api/v1/qa/diagnose/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack || 'No stack trace available',
          url: error.url,
        }),
      });
      const body = await res.json();
      if (res.ok) {
        toast.success('Diagnosis Complete: A Troubleshooting Doc has been created.');
        setSelectedError({ ...error, message: body.data.diagnosis });
      }
    } catch {
      toast.error('Diagnosis failed');
    } finally {
      setIsDiagnosing(null);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 bg-slate-950 font-sans min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-glow-rose">
            <ShieldAlert size={32} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              Neural QA Center
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                Autonomous Quality Engineering
              </span>
              <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-widest leading-none">
                CORE_SENTRY_ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/5 border border-white/10 group">
          <Activity size={16} className="text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            System Integrity: 98.4%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Error Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
              Live Incident Stream
            </h3>
            <button className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2 hover:text-rose-300 transition-colors">
              Clear Buffer <Terminal size={12} />
            </button>
          </div>

          <div className="space-y-4">
            {errors.map((error) => (
              <div
                key={error.id}
                onClick={() => setSelectedError(error)}
                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group select-none ${
                  selectedError?.id === error.id
                    ? 'bg-rose-500/10 border-rose-500/30 shadow-glow-rose'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bug
                      size={16}
                      className={error.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}
                    />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                      {error.severity} incident
                    </span>
                  </div>
                  <span className="text-[9px] font-medium text-white/20 uppercase tabular-nums">
                    14:24:02 UTC
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2 leading-tight">{error.message}</h4>
                <div className="flex items-center gap-2 text-[10px] font-medium text-white/30 font-mono italic">
                  <ChevronRight size={10} /> {error.url}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="relative">
          {selectedError ? (
            <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <FileSearch size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                      AI Diagnosis
                    </h3>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      Neural Logic Scan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDiagnose(selectedError)}
                  disabled={!!isDiagnosing}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-500/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/30 transition-all shadow-glow-indigo disabled:opacity-50"
                >
                  {isDiagnosing ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Zap size={14} />
                  )}
                  {isDiagnosing ? 'Scanning...' : 'Self-Heal'}
                </button>
              </div>

              <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 font-mono text-[11px] text-white/60 leading-relaxed max-h-[400px] overflow-auto scrollbar-hide">
                {selectedError.stack ? (
                  <div className="space-y-4">
                    <div className="text-rose-400/80 font-bold tracking-tight mb-4 uppercase">
                      [[ TRACE_BEGIN ]]
                    </div>
                    {selectedError.stack.split('\n').map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Code size={32} className="text-white/10" />
                    <span className="uppercase tracking-[0.3em] text-white/20">
                      Awaiting Signal Acquisition...
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Proposed Fix
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-white/40 leading-relaxed italic">
                    Regression detected in ProjectService. Suggesting validation middleware
                    injection at line 142.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white/10 transition-all">
                  <Code
                    size={20}
                    className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Open in IDE
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
              <ShieldAlert size={80} className="text-white/10 mb-6" />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.5em]">
                Command Idle
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
