'use client';

import { useParams } from 'next/navigation';
import { useDoc, useSummarizeDoc } from '@/features/docs/hooks/use-doc';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { RichTextEditor } from '@/features/docs/components/RichTextEditor';
import { DocTOC } from '@/features/docs/components/DocTOC';
import { DocVersionSidebar } from '@/features/docs/components/DocVersionSidebar';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import { useState } from 'react';
import {
  Settings,
  History,
  UserPlus,
  MoreVertical,
  Loader2,
  Sparkles,
  X,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocDetailPage() {
  const params = useParams<{ docId: string }>();
  const [showVersions, setShowVersions] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { user } = useAuthSession();
  const {
    data: doc,
    isLoading,
    isError,
    error,
    localTitle,
    setLocalTitle,
    localContent,
    setLocalContent,
    isSaving,
    refetch,
  } = useDoc(params.docId);

  const summarizeMutation = useSummarizeDoc();

  const handleSummarize = async () => {
    try {
      const result = await summarizeMutation.mutateAsync(params.docId);
      setAiSummary(result.summary);
      toast.success('Neural Intelligence Synthesis Complete');
    } catch (err) {
      console.error('Failed to summarize doc:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-950 items-center justify-center gap-6">
        <Activity className="h-12 w-12 text-brand-500/40 animate-pulse" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
          Establishing_Neural_Link...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-slate-950">
        <div className="p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center max-w-lg">
          <Zap size={48} className="mx-auto text-rose-500 mb-6 opacity-40" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            Protocol_Interrupted
          </h3>
          <p className="text-sm text-white/20 mb-8">
            {error?.message || 'Access denied to the specific intelligence node.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-8 py-4 bg-brand-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-glow-brand/20 active:scale-95 transition-all"
          >
            Retry_Initialization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden group">
      {/* Background Pulse */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

      {/* Editor Header - Archive Controller */}
      <header className="flex h-16 shrink-0 items-center justify-between px-8 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className={`h-2 w-2 rounded-full ${isSaving ? 'bg-brand-500 animate-pulse shadow-glow-brand' : 'bg-emerald-500 shadow-glow-emerald'}`}
            />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
              {isSaving ? 'Synchronizing_Stream' : 'Archive_Sync_Secure'}
            </span>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
            <ShieldCheck size={12} className="text-brand-400" />
            <span className="text-[10px] font-black text-brand-400/80 uppercase tracking-widest">
              v4.8.2_Stable
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleSummarize}
            disabled={summarizeMutation.isPending}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest group disabled:opacity-30"
          >
            {summarizeMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} className="group-hover:scale-125 transition-transform" />
            )}
            <span>AI_Synthesis</span>
          </button>

          <div className="h-6 w-px bg-white/5" />

          <div className="flex items-center gap-3">
            <button
              className="p-2.5 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all relative group"
              title="Share Interface"
            >
              <UserPlus size={18} />
            </button>
            <button
              onClick={() => setShowVersions(!showVersions)}
              className={`p-2.5 transition-all text-white/20 rounded-xl ${showVersions ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'hover:text-white hover:bg-white/5'}`}
              title="Archive Timeline"
            >
              <History size={18} />
            </button>
            <button className="p-2.5 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Settings size={18} />
            </button>
            <button className="p-2.5 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Intelligence Insights Surface */}
      {aiSummary && (
        <div className="px-12 pt-10 max-w-5xl mx-auto w-full animate-in slide-in-from-right-12 fade-in duration-700">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/[0.03] p-8 shadow-2xl backdrop-blur-xl group/summary">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.05] blur-3xl rounded-full translate-x-32 -translate-y-32" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-2.5 rounded-2xl text-emerald-400 border border-emerald-500/30 shadow-glow-emerald/10">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60 leading-none mb-1.5">
                    Protocol Intelligence Synthesis
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                      Scan_Complete // Accuracy_98.4%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAiSummary(null)}
                className="p-2 text-white/10 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[15px] leading-relaxed text-emerald-100/70 italic font-medium relative z-10">
              "{aiSummary}"
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Surface */}
        <div className="flex-1 overflow-y-auto px-12 py-16 scrollbar-none scroll-smooth">
          <div className="max-w-4xl mx-auto animate-in fade-in duration-1000">
            {/* Title Block */}
            <div className="mb-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-10 bg-brand-500/40" />
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
                  Private_Archive_Node
                </span>
              </div>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="INITIALIZE_TITLE..."
                className="w-full text-5xl font-black text-white border-none focus:outline-none placeholder:text-white/5 bg-transparent transition-all tracking-tighter"
              />

              <div className="flex items-center gap-6 pt-4 text-white/20">
                <div className="flex items-center gap-3">
                  <AssigneeAvatar
                    name={doc?.creator?.fullName || 'Operative'}
                    src={doc?.creator?.avatarUrl}
                    size="sm"
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {doc?.creator?.fullName} // ARCHIVIST
                  </span>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/5" />
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                  <span>INDEXED:</span>
                  <span className="text-white/40">
                    {new Date(doc?.updatedAt || '').toLocaleString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-[700px] pb-48">
              <RichTextEditor
                docId={params.docId}
                content={localContent}
                onChange={setLocalContent}
                user={
                  user
                    ? {
                        id: user.id,
                        fullName: user.fullName,
                        avatarColor: user.avatarColor,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Global Nav Surface */}
        {!showVersions && <DocTOC content={localContent} />}

        {/* Version Timeline Surface */}
        {showVersions && (
          <DocVersionSidebar
            docId={params.docId}
            onClose={() => setShowVersions(false)}
            onRestore={(content) => {
              setLocalContent(content);
              toast.success('Sequence Recovered. Auto-sync initiated.');
            }}
          />
        )}
      </div>

      {/* Controller Footer */}
      <footer className="h-10 px-8 flex items-center justify-between border-t border-white/5 bg-black/20 text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Zap size={10} className="text-brand-500" />
            SECURE_LINK_ACTIVE
          </span>
          <span className="flex items-center gap-2">
            <Activity size={10} />
            NEURAL_STREAM_SYNCED
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>ARCHIVE.NODE_04.13.00</span>
        </div>
      </footer>
    </div>
  );
}
