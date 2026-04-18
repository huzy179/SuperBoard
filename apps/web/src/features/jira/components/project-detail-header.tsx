'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ProjectDetailDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { getInitials } from '@/lib/helpers';
import { MissionTimeline } from './MissionTimeline';
import { MissionCommandBriefing } from './MissionCommandBriefing';
import {
  Brain,
  Settings2,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Zap,
  BarChart3,
  Share2,
  Plus,
  History,
  Activity,
  Sparkles,
  Mic,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AiPlannerModal } from '@/features/ai/components/ai-planner-modal';

import { useProjectDetailContext } from '../context/ProjectDetailContext';

interface ProjectDetailHeaderProps {
  project: ProjectDetailDTO;
  projectKey: string | null;
  viewerCount: number;
  isCopyLinkSuccess: boolean;
  onCopyFilterLink: () => void;
  onPlanExecuted?: () => void;
}

export function ProjectDetailHeader({
  project,
  projectKey,
  viewerCount,
  isCopyLinkSuccess,
  onCopyFilterLink,
  onPlanExecuted,
}: ProjectDetailHeaderProps) {
  const pathname = usePathname();
  const {
    viewMode,
    setViewMode,
    setShowCreateTaskPanel,
    setShowAutomationPanel,
    setShowKnowledgeMap,
  } = useProjectDetailContext();

  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const currentViewLabel = useMemo(() => {
    if (viewMode === 'list') return 'Danh sách';
    if (viewMode === 'calendar') return 'Lịch';
    if (viewMode === 'insights') return 'Phân tích';
    return 'Board';
  }, [viewMode]);

  const visibleMemberAvatars = project.members.slice(0, 5);

  const navItems = [
    { id: 'board', label: 'Bảng công việc', icon: <LayoutGrid size={14} />, mode: 'board' },
    { id: 'list', label: 'Danh sách', icon: <List size={14} />, mode: 'list' },
    { id: 'calendar', label: 'Lịch', icon: <CalendarIcon size={14} />, mode: 'calendar' },
    { id: 'insights', label: 'Phân tích', icon: <Sparkles size={14} />, mode: 'insights' },
  ];

  return (
    <header className="space-y-10 pb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* Breadcrumbs - Mission Trail */}
      <div className="px-6">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-4 text-[11px] uppercase font-black tracking-[0.5em] text-white/20"
        >
          <a href="/jira" className="transition-all hover:text-brand-400 hover:tracking-[0.6em]">
            WORKSPACE
          </a>
          <span className="text-white/5">/</span>
          <span className="text-white/40">{project.name.toUpperCase()}</span>
          <span className="text-white/5">/</span>
          <span className="text-brand-400 bg-brand-500/5 px-4 py-1.5 rounded-full border border-brand-500/20 shadow-glow-brand/10">
            {currentViewLabel.toUpperCase()}
          </span>
        </nav>
      </div>

      <div className="group relative overflow-hidden rounded-[4rem] border border-white/5 bg-white/[0.01] p-12 shadow-luxe backdrop-blur-[40px] transition-all duration-1000">
        {/* Superior Rim Lighting */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-brand-500/[0.03] rounded-full blur-[120px] pointer-events-none group-hover:bg-brand-500/[0.05] transition-all duration-1000" />

        <div className="flex flex-wrap items-start justify-between gap-12 relative z-10">
          <div className="flex-1 min-w-0 space-y-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-6 mb-4 flex-wrap">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-brand-500/20 blur-2xl opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                  <span className="relative text-6xl drop-shadow-luxe grayscale group-hover:grayscale-0 transition-all duration-1000 cursor-default scale-110">
                    {project.icon || '🚀'}
                  </span>
                  <div className="absolute -right-2 -top-2">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-500 shadow-glow-brand ring-4 ring-slate-950/40"></span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-6xl font-black tracking-tighter text-white uppercase leading-none italic group-hover:text-brand-400 transition-colors">
                    {project.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-4">
                    {projectKey && (
                      <div className="px-4 py-1.5 bg-brand-500/10 rounded-xl border border-brand-500/20 shadow-inner">
                        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-brand-400">
                          {projectKey}
                        </span>
                      </div>
                    )}
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] ml-2">
                      ARCH_LVL_9
                    </span>
                  </div>
                </div>

                <Link
                  href={`/jira/projects/${project.id}/settings/workflow`}
                  className="p-4 bg-white/5 rounded-2xl text-white/20 hover:text-brand-400 hover:bg-white/10 transition-all hover:rotate-180 border border-white/10 shadow-inner group/settings"
                  title="Logic Architect"
                >
                  <Settings2 size={20} className="group-hover:scale-110 transition-transform" />
                </Link>

                <div className="group/intel relative flex items-center gap-3 px-6 py-3 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/10 transition-all active:scale-95 shadow-glow-emerald/5">
                  <Brain size={18} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    MISSION_HEALTH: NOMINAL
                  </span>
                  <div className="absolute top-16 left-0 w-80 p-6 bg-slate-950/90 border border-white/10 rounded-[2rem] shadow-luxe opacity-0 group-hover/intel:opacity-100 translate-y-3 group-hover/intel:translate-y-0 transition-all pointer-events-none z-50 backdrop-blur-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                        Neural Synopsis
                      </span>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-glow-emerald" />
                    </div>
                    <p className="text-[10px] font-bold text-white/60 leading-relaxed italic border-l-2 border-emerald-500 pl-4">
                      Project architecture is performing at peak efficiency. Resource allocation
                      vector: 0.94. No critical divergences detected.
                    </p>
                  </div>
                </div>
              </div>

              <p className="max-w-4xl text-base font-bold leading-relaxed text-white/30 mb-4 italic pl-6 border-l border-white/5">
                "{project.description || 'INITIATING_MISSION_PROTOCOL...'}"
              </p>
            </div>

            <div className="flex items-center gap-16">
              <div className="flex -space-x-5">
                {visibleMemberAvatars.map((member) => (
                  <div
                    key={member.id}
                    className="group/avatar relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-slate-950 bg-slate-900 text-[11px] font-black text-white transition-all hover:z-20 hover:scale-110 hover:-translate-y-1 active:scale-95 shadow-luxe"
                    title={member.fullName}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-white/20 rounded-t-2xl" />
                    {getInitials(member.fullName)}
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-4 border-slate-950 rounded-full shadow-glow-emerald" />
                  </div>
                ))}
                {project.members.length > 5 && (
                  <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-slate-950 bg-brand-500 text-[11px] font-black text-white shadow-luxe">
                    <div className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />+
                    {project.members.length - 5}
                  </div>
                )}
              </div>

              <div className="h-12 w-px bg-white/5" />

              <div className="flex items-center gap-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                    <History size={12} className="text-white/20" /> CHRONO_SYNC
                  </div>
                  <span className="text-xs font-black text-white/60 uppercase tracking-widest block">
                    {formatDate(project.updatedAt).toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                    <Activity size={12} className="text-emerald-500/40" /> OPERATORS_ACTIVE
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-glow-emerald"></span>
                    </span>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                      {viewerCount} MONITORING
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-10">
            <div className="flex items-center gap-4 p-4 bg-white/[0.01] rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-luxe relative group/controls">
              {/* Internal Accent */}
              <div className="absolute inset-0 bg-brand-500/[0.01] rounded-[3rem] pointer-events-none" />

              <button
                type="button"
                onClick={() => setShowCreateTaskPanel((value) => !value)}
                className="group relative flex items-center gap-3 rounded-[1.5rem] bg-white px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 transition-all hover:scale-105 active:scale-95 shadow-luxe overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                  <Plus size={16} /> INITIALIZE UNIT
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiPlanner(true)}
                className="group relative flex items-center gap-3 rounded-[1.5rem] bg-indigo-500 px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 hover:shadow-glow-indigo/40 active:scale-95 shadow-inner overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
                <Sparkles size={16} className="animate-pulse" />
                <span>AI_STRATEGY</span>
              </button>

              <button
                onClick={() => setShowBriefing(true)}
                className="flex items-center gap-3 rounded-[1.5rem] bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand-500 hover:shadow-glow-brand hover:scale-105 active:scale-95 border border-white/5 group/mic overflow-hidden"
              >
                <Mic
                  size={18}
                  className="text-brand-400 group-hover:text-white transition-colors"
                />
                <span>SITREP</span>
              </button>

              <div className="h-10 w-px bg-white/5 mx-2" />

              <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-[2rem] border border-white/5 shadow-inner">
                {navItems.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setViewMode(v.mode as 'board' | 'list' | 'calendar' | 'insights')
                    }
                    className={`flex items-center gap-3 rounded-[1.25rem] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewMode === v.mode
                        ? 'bg-white text-slate-950 shadow-luxe scale-105'
                        : 'text-white/20 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {v.icon}
                    <span className={viewMode === v.mode ? 'block' : 'hidden md:block'}>
                      {v.label.toUpperCase()}
                    </span>
                  </button>
                ))}

                <Link
                  href={`/jira/projects/${project.id}/reports`}
                  className={`flex items-center gap-3 rounded-[1.25rem] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    pathname?.endsWith('/reports')
                      ? 'bg-indigo-500 text-white shadow-glow-indigo scale-105'
                      : 'text-white/20 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 size={16} />
                  <span className="hidden md:block">REPORTS</span>
                </Link>
              </div>

              <div className="h-8 w-px bg-white/5 mx-2" />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAutomationPanel(true)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all border bg-white/5 text-white/10 border-white/5 hover:text-white hover:bg-white/10 hover:shadow-inner"
                  title="Automation Matrix"
                >
                  <Zap size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowKnowledgeMap(true)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all border bg-brand-500/5 text-brand-500/40 border-brand-500/10 hover:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/20 shadow-glow-brand/10"
                  title="Neural Knowledge Map"
                >
                  <Activity size={20} />
                </button>

                <button
                  type="button"
                  onClick={onCopyFilterLink}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${
                    isCopyLinkSuccess
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 shadow-glow-emerald/20'
                      : 'bg-white/5 text-white/10 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                  title="Share Mission Signal"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 px-10 py-3 bg-white/[0.01] rounded-full border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 text-[9px] font-black text-white/5 uppercase tracking-[0.5em]">
                <Sparkles size={12} /> SYSTEM_READY // LAYER_4_SYNCED
              </div>
              <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: [-96, 96] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="h-full w-12 bg-brand-500/40 blur-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Neural Mission Timeline */}
      <MissionTimeline projectId={project.id} />

      <MissionCommandBriefing
        projectId={project.id}
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
      />

      <AiPlannerModal
        projectId={project.id}
        isOpen={showAiPlanner}
        onClose={() => setShowAiPlanner(false)}
        onPlanExecuted={() => onPlanExecuted?.()}
      />
    </header>
  );
}
