'use client';

import { useDocVersions } from '../hooks/use-doc';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { History, X, RotateCcw, Clock, Activity, ShieldCheck, Zap } from 'lucide-react';

interface DocVersionSidebarProps {
  docId: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRestore: (content: any) => void;
}

export function DocVersionSidebar({ docId, onClose, onRestore }: DocVersionSidebarProps) {
  const { data: versions, isLoading } = useDocVersions(docId);

  return (
    <div className="w-96 border-l border-white/5 bg-slate-950/40 backdrop-blur-3xl flex flex-col h-full animate-in slide-in-from-right duration-500 shadow-2xl z-50">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20">
              <History size={16} className="text-brand-400" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Archive_Timeline
            </h3>
          </div>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest pl-11">
            Version_Control_Active
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/20 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Activity className="h-10 w-10 text-brand-500/40 animate-pulse" />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
              Decoding_Archive...
            </span>
          </div>
        ) : versions?.length === 0 ? (
          <div className="text-center py-20 px-10">
            <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white/5">
              <Clock size={32} />
            </div>
            <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-2">
              Zero_States_Found
            </h4>
            <p className="text-[10px] text-white/10 font-medium uppercase tracking-tight">
              Timeline initialization pending further edits.
            </p>
          </div>
        ) : (
          versions?.map((version, idx) => (
            <div
              key={version.id}
              className="group relative p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-brand-500/30 hover:bg-brand-500/[0.03] transition-all duration-500 overflow-hidden"
            >
              {/* Luxury Detail */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/[0.01] blur-xl rounded-full" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-400 opacity-40" />
                    <span className="text-[13px] font-black text-white uppercase tracking-wider">
                      {format(new Date(version.savedAt), 'HH:mm // MMM dd', { locale: enUS })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-3.5">
                    <ShieldCheck size={10} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">
                      SYSTEM_AUTO_SYNC
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRestore(version.content)}
                  className="p-3 opacity-0 group-hover:opacity-100 bg-brand-500 text-white rounded-2xl shadow-glow-brand/20 transition-all hover:scale-110 active:scale-95 flex items-center gap-2"
                  title="Restore Sequence"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="mt-4 px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex justify-between items-center group-hover:text-white/40 transition-colors">
                <span>INDEX_NODE_{idx.toString().padStart(2, '0')}</span>
                <span className="text-brand-500/40 font-mono">STABLE</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-slate-900/40 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <Zap size={14} className="text-brand-500 animate-pulse" />
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
            Neural_Sync_Active
          </span>
        </div>
        <p className="text-[10px] text-white/10 font-bold leading-relaxed uppercase tracking-tight">
          ARCHIVE_PROTOCOL_01: INTEL IS AUTOMATICALLY SYNCHRONIZED TO THE GLOBAL MATRIX UPON EACH
          VALID TRANSACTION.
        </p>
      </div>
    </div>
  );
}
