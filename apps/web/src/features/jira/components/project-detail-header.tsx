'use client';

import { useState } from 'react';
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

interface ProjectDetailHeaderProps {
  project: ProjectDetailDTO;
  projectKey: string | null;
  currentViewLabel: string;
  viewMode: 'board' | 'list' | 'calendar' | 'insights';
  setViewMode: (mode: 'board' | 'list' | 'calendar' | 'insights') => void;
  viewerCount: number;
  setShowCreateTaskPanel: (show: boolean | ((val: boolean) => boolean)) => void;
  isCopyLinkSuccess: boolean;
  onCopyFilterLink: () => void;
  onOpenAutomation: () => void;
  onOpenGraph: () => void;
  onPlanExecuted?: () => void;
}

export function ProjectDetailHeader({
  project,
  projectKey,
  currentViewLabel,
  viewMode,
  setViewMode,
  viewerCount,
  setShowCreateTaskPanel,
  isCopyLinkSuccess,
  onCopyFilterLink,
  onOpenAutomation,
  onOpenGraph,
  onPlanExecuted,
}: ProjectDetailHeaderProps) {
  const pathname = usePathname();
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const visibleMemberAvatars = project.members.slice(0, 5);

  const navItems = [
    { id: 'board', label: 'Tactical Board', icon: <LayoutGrid size={14} />, mode: 'board' },
    { id: 'list', label: 'Mission List', icon: <List size={14} />, mode: 'list' },
    { id: 'calendar', label: 'Chronos', icon: <CalendarIcon size={14} />, mode: 'calendar' },
    { id: 'insights', label: 'Strategic Insights', icon: <Sparkles size={14} />, mode: 'insights' },
  ];

  return (
    <header className="space-y-6 pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Breadcrumbs */}
      <div className="px-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.4em] text-white/30"
        >
          <a href="/jira" className="transition-colors hover:text-brand-400">
            Project Nodes
          </a>
          <span className="text-white/10 opacity-50">/</span>
          <span className="text-white/20">{project.name}</span>
          <span className="text-white/10 opacity-50">/</span>
          <span className="text-brand-400 border-b border-brand-500/50 pb-0.5 shadow-glow-brand">
            {currentViewLabel}
          </span>
        </nav>
      </div>

      <div className="group relative overflow-hidden rounded-[3rem] border border-white/5 bg-slate-950/80 p-10 shadow-glass backdrop-blur-3xl transition-all duration-700">
        {/* Rim Lighting & Aura */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="flex flex-wrap items-start justify-between gap-10 relative z-10">
          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="relative">
                  <span className="text-5xl drop-shadow-luxe grayscale group-hover:grayscale-0 transition-all duration-700 cursor-default">
                    {project.icon || '🚀'}
                  </span>
                  <div className="absolute -right-1 -top-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500 shadow-glow-brand"></span>
                    </span>
                  </div>
                </div>

                <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
                  {project.name}
                </h1>

                {projectKey && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 shadow-luxe transition-all hover:bg-white/10">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-brand-400">
                      NODE_ID: {projectKey}
                    </span>
                  </div>
                )}

                <Link
                  href={`/jira/projects/${project.id}/settings/workflow`}
                  className="p-3 bg-white/5 rounded-[1.25rem] text-white/20 hover:text-brand-400 hover:bg-white/10 transition-all hover:rotate-180 border border-white/5"
                  title="Neural Workflow Architect"
                >
                  <Settings2 size={18} />
                </Link>

                <div className="group/intel relative flex items-center gap-2 px-4 py-2 bg-brand-500/5 rounded-2xl border border-brand-500/20 text-brand-400 cursor-pointer hover:bg-brand-500/10 transition-all active:scale-95">
                  <Brain size={16} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Intelligence Pulse
                  </span>
                  <div className="absolute top-12 left-0 w-64 p-4 bg-slate-900 border border-white/10 rounded-2xl shadow-glass opacity-0 group-hover/intel:opacity-100 translate-y-2 group-hover/intel:translate-y-0 transition-all pointer-events-none z-50">
                    <p className="text-[9px] font-bold text-white/50 leading-relaxed italic">
                      Project health is tracking at optimal levels. Resource allocation efficiency:
                      94%.
                    </p>
                  </div>
                </div>
              </div>

              <p className="max-w-3xl text-sm font-medium leading-relaxed text-white/40 mb-2 italic">
                "{project.description || 'Manifest objectives pending definition...'}"
              </p>
            </div>

            <div className="flex items-center gap-10">
              <div className="flex -space-x-4">
                {visibleMemberAvatars.map((member) => (
                  <div
                    key={member.id}
                    className="group/avatar relative inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] border-2 border-slate-950 bg-slate-900 text-[10px] font-black text-white transition-all hover:z-20 hover:scale-110 active:scale-95 shadow-luxe"
                    title={member.fullName}
                  >
                    <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-[1.25rem]" />
                    {getInitials(member.fullName)}
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                  </div>
                ))}
                {project.members.length > 5 && (
                  <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] border-2 border-slate-950 bg-brand-500 text-[10px] font-black text-white shadow-luxe">
                    +{project.members.length - 5}
                  </div>
                )}
              </div>

              <div className="h-10 w-px bg-white/5" />

              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1.5">
                    <History size={10} /> Sync Status
                  </div>
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">
                    MODIFIED {formatDate(project.updatedAt)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1.5">
                    <Activity size={10} /> Active Operatives
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                      {viewerCount} Live Status
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-glass">
              <button
                type="button"
                onClick={() => setShowCreateTaskPanel((value) => !value)}
                className="group relative flex items-center gap-2 rounded-full bg-white px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-105 active:scale-95 shadow-luxe overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
                  <Plus size={14} /> Initialize Mission
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAiPlanner(true)}
                className="group relative flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 transition-all hover:bg-indigo-500 hover:text-white active:scale-95 shadow-glow-brand"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>Plan with AI</span>
              </button>

              <button
                onClick={() => setShowBriefing(true)}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-brand-500 hover:shadow-glow-brand"
              >
                <Mic size={16} />
                <span>Mission Briefing</span>
              </button>

              <div className="h-8 w-px bg-white/10" />

              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-full border border-white/5">
                {navItems.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setViewMode(v.mode as 'board' | 'list' | 'calendar' | 'insights')
                    }
                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                      viewMode === v.mode
                        ? 'bg-white text-slate-950 shadow-luxe scale-105'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </button>
                ))}

                <Link
                  href={`/jira/projects/${project.id}/reports`}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                    pathname?.endsWith('/reports')
                      ? 'bg-indigo-500 text-white shadow-glow-brand scale-105'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>Intelligence</span>
                </Link>
              </div>

              <div className="h-6 w-px bg-white/10 mx-1" />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpenAutomation}
                  className="p-3 rounded-full transition-all border bg-white/5 text-white/20 border-white/5 hover:text-white hover:bg-white/10"
                  title="Automation Gateway"
                >
                  <Zap size={16} />
                </button>

                <button
                  type="button"
                  onClick={onOpenGraph}
                  className="p-3 rounded-full transition-all border bg-white/5 text-white/20 border-white/5 hover:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/20 shadow-glow-brand"
                  title="Neural Knowledge Map"
                >
                  <Activity size={16} />
                </button>

                <button
                  type="button"
                  onClick={onCopyFilterLink}
                  className={`p-3 rounded-full transition-all border ${
                    isCopyLinkSuccess
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                      : 'bg-white/5 text-white/20 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                  title="Synchronize Neural Link"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
            <div className="mr-6">
              <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">
                Command Protocol V4.2
              </span>
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
