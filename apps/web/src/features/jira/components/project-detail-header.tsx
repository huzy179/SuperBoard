'use client';

import Link from 'next/link';
import type { ProjectDetailDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { getInitials } from '@/lib/helpers';

interface ProjectDetailHeaderProps {
  project: ProjectDetailDTO;
  projectKey: string | null;
  currentViewLabel: string;
  viewMode: 'board' | 'list' | 'calendar';
  setViewMode: (mode: 'board' | 'list' | 'calendar') => void;
  viewerCount: number;
  setShowCreateTaskPanel: (show: boolean | ((val: boolean) => boolean)) => void;
  isCopyLinkSuccess: boolean;
  onCopyFilterLink: () => void;
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
}: ProjectDetailHeaderProps) {
  const visibleMemberAvatars = project.members.slice(0, 5);

  return (
    <header className="space-y-4 pb-4">
      <div className="mb-2 px-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"
        >
          <Link href="/jira" className="transition-colors hover:text-brand-600">
            Dự án
          </Link>
          <span className="text-slate-200">/</span>
          <span className="text-slate-400">{project.name}</span>
          <span className="text-slate-200">/</span>
          <span className="text-slate-900 border-b-2 border-brand-500 pb-0.5">
            {currentViewLabel}
          </span>
        </nav>
      </div>

      <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/40 p-8 shadow-glass backdrop-blur-2xl transition-all duration-500 hover:shadow-2xl hover:border-white/80">
        {/* Rim Lighting Effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        <div className="flex flex-wrap items-start justify-between gap-8 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <span className="text-4xl drop-shadow-2xl filter transform transition group-hover:scale-110 duration-500">
                {project.icon || '📊'}
              </span>
              <h1 className="text-4xl font-black tracking-tight text-luxe-gradient leading-tight">
                {project.name}
              </h1>
              {projectKey ? (
                <span className="rounded-xl bg-slate-900 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-slate-100 shadow-xl border border-white/10">
                  {projectKey}
                </span>
              ) : null}
              <Link
                href={`/jira/projects/${project.id}/settings/workflow`}
                className="ml-2 rounded-xl bg-white/50 p-2 text-slate-400 backdrop-blur-md transition-all hover:bg-white hover:text-brand-600 hover:rotate-90 hover:shadow-lg"
                title="Cấu hình quy trình (Workflow)"
              >
                ⚙️
              </Link>
            </div>
            <p className="max-w-2xl text-[14px] font-medium leading-relaxed text-slate-600/80 mb-6">
              {project.description || 'Chưa có mô tả cho dự án này.'}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {visibleMemberAvatars.map((member) => (
                  <div
                    key={member.id}
                    className="group/avatar relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-white bg-slate-50 text-[11px] font-black text-slate-900 shadow-luxe transition-transform hover:z-20 hover:scale-110 active:scale-95"
                    title={member.fullName}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl" />
                    {getInitials(member.fullName)}
                  </div>
                ))}
                {project.members.length > 5 && (
                  <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-white bg-slate-900 text-[10px] font-black text-white shadow-luxe">
                    +{project.members.length - 5}
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-slate-200/50 mx-2" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Cập nhật cuối
                </span>
                <span className="text-[12px] font-bold text-slate-800">
                  {formatDate(project.updatedAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/60 bg-white/20 p-2 backdrop-blur-md shadow-luxe">
            <button
              type="button"
              onClick={() => setShowCreateTaskPanel((value) => !value)}
              className="group relative flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:bg-brand-600 hover:shadow-2xl hover:shadow-brand-500/40 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
              <span className="relative">+ Tạo task</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-50/50 rounded-2xl text-brand-700 font-black text-[10px] uppercase tracking-wider relative group/live">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
              </span>
              <span>{viewerCount} Live</span>
            </div>

            <div className="h-6 w-px bg-slate-200/50 mx-1" />

            {[
              { id: 'board', label: 'Board' },
              { id: 'list', label: 'Danh sách' },
              { id: 'calendar', label: 'Lịch' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewMode(v.id as 'board' | 'list' | 'calendar')}
                className={`rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                  viewMode === v.id
                    ? 'bg-white text-brand-700 shadow-xl scale-105'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 hover:scale-105'
                }`}
              >
                {v.label}
              </button>
            ))}

            <Link
              href={`/jira/projects/${project.id}/automation`}
              className="group flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-brand-600 transition-all hover:bg-white hover:shadow-xl hover:scale-105"
            >
              <span className="group-hover:animate-pulse">⚡</span> Tự động
            </Link>

            <div className="h-6 w-px bg-slate-200/50 mx-1" />

            <button
              type="button"
              onClick={onCopyFilterLink}
              className={`rounded-2xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                isCopyLinkSuccess
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              {isCopyLinkSuccess ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
