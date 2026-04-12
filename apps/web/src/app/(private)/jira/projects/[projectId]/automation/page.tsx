'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus } from 'lucide-react';
import { AutomationList } from '@/features/automation/components/AutomationList';
import { CreateRuleModal } from '@/features/automation/components/CreateRuleModal';
import { AIAutomationDialog } from '@/features/automation/components/AIAutomationDialog';
import { useProjectDetail } from '@/features/jira/hooks';
import { FullPageLoader } from '@/components/ui/page-states';

export default function AutomationPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const { data: project, isLoading } = useProjectDetail(projectId);

  if (isLoading) return <FullPageLoader label="Đang tải cấu hình..." />;

  const workspaceId = project?.workspaceId || '';

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      {/* Immersive Aura Backdrop */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse delay-1000" />
        {/* Physical Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-8 py-12 flex-1">
        <header className="mb-12 animate-in slide-in-from-top-4 duration-700">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 text-white/40 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Return to Project</span>
          </button>

          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 rounded-3xl text-brand-400 shadow-luxe border border-white/5">
                  <Sparkles size={32} className="animate-pulse" />
                </div>
                <div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
                    Automation Hub
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">
                      Intelligence Engine Online
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xl text-white/60 font-medium max-w-2xl leading-relaxed">
                Configure autonomous workflow protocols for{' '}
                <span className="text-white font-black underline decoration-brand-500 decoration-4 underline-offset-8">
                  {project?.name}
                </span>
                .
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="group relative px-10 py-5 bg-white text-slate-900 rounded-2xl font-black shadow-luxe hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase text-[11px] tracking-[0.2em] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={20} className="relative z-10" />
              <span className="relative z-10">New Logic Rule</span>
            </button>
          </div>
        </header>

        <main className="relative group overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 shadow-glass backdrop-blur-3xl transition-all animate-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="px-10 py-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Current Logic Stack
            </h2>
          </div>
          <div className="p-10 min-h-[400px]">
            <AutomationList workspaceId={workspaceId} projectId={projectId} />
          </div>
        </main>

        <section className="mt-12 p-12 bg-slate-900/50 rounded-[3rem] border border-white/5 backdrop-blur-3xl text-white flex flex-wrap items-center justify-between gap-8 overflow-hidden relative group animate-in zoom-in-95 duration-700 delay-300">
          {/* Neural Mesh Orb Visual */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/20 rounded-full blur-[100px] group-hover:bg-brand-500/30 transition-all duration-700" />
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700 font-black" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-brand-400 animate-ping" />
              <h3 className="text-3xl font-black tracking-tighter uppercase">
                Enhance with Neural Core
              </h3>
            </div>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] max-w-md leading-relaxed">
              Leverage SuperBoard AI to architect complex autonomous protocols using natural
              language intelligence.
            </p>
          </div>

          <button
            onClick={() => setShowAIDialog(true)}
            className="group relative z-10 px-10 py-6 bg-slate-100 text-slate-900 rounded-[2rem] font-black shadow-luxe hover:bg-white hover:scale-110 transition-all flex items-center gap-3 active:scale-95 uppercase text-[11px] tracking-[0.2em]"
          >
            <Sparkles
              size={22}
              className="text-brand-600 group-hover:rotate-12 transition-transform"
            />
            <span>Connect to AI Assistant</span>
          </button>
        </section>
      </div>

      {showCreateModal && (
        <CreateRuleModal
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showAIDialog && (
        <AIAutomationDialog
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowAIDialog(false)}
        />
      )}
    </div>
  );
}
