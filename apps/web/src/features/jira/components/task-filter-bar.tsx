import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';
import type { TaskSortBy } from '@/lib/helpers/task-view';
import { useProjectDetailContext } from '../context/ProjectDetailContext';
import { ProjectMemberDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';

type TaskFilterBarProps = {
  members: ProjectMemberDTO[];
  workflow?: WorkflowStatusTemplateDTO | undefined;
};

export function TaskFilterBar({ members, workflow }: TaskFilterBarProps) {
  const {
    filterQuery,
    setFilterQuery,
    filterAssignee,
    setFilterAssignee,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    showArchived,
    setShowArchived,
    resetFilters,
    toggleFilter,
  } = useProjectDetailContext();

  const hasActiveFilters =
    filterStatuses.size > 0 ||
    filterPriorities.size > 0 ||
    filterTypes.size > 0 ||
    !!filterAssignee ||
    !!filterQuery ||
    showArchived;

  return (
    <div className="mb-10 rounded-[3rem] border border-white/5 bg-white/[0.01] p-6 shadow-luxe backdrop-blur-[40px] relative overflow-hidden group">
      {/* Internal Rim Lighting */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mb-6 flex items-center justify-between px-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-brand-500 shadow-glow-brand animate-pulse" />
          <p className="text-[11px] font-black tracking-[0.6em] text-white/20 uppercase italic">
            SIGNAL_CHANNEL_HUB
          </p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="group relative rounded-2xl px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-inner overflow-hidden"
          >
            <span className="relative z-10 italic">RESET_SYSTEMS</span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-6 relative z-10">
        {/* Frequency Search */}
        <div className="relative w-full sm:w-80 group/input">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-brand-400 transition-colors">
            <Sparkles size={14} />
          </div>
          <input
            type="text"
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder="FREQUENCY SEARCH..."
            className="w-full rounded-[1.5rem] border border-white/5 bg-white/[0.02] pl-14 pr-6 py-4 text-xs font-black text-white placeholder:text-white/5 focus:bg-white/[0.04] focus:border-brand-500/30 outline-none transition-all shadow-inner italic tracking-widest"
            aria-label="Frequency search"
          />
        </div>

        <div className="h-10 w-px bg-white/5 mx-2 hidden sm:block" />

        {/* Status Channels */}
        <div className="flex flex-wrap items-center gap-3 rounded-[1.75rem] bg-slate-950/40 border border-white/5 px-5 py-3 shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 mr-2 italic">
            STATUS
          </span>
          <div className="flex items-center gap-2">
            {(workflow?.statuses || BOARD_COLUMNS).map((s) => {
              const key = 'key' in s ? s.key : s.key;
              const label = 'name' in s ? s.name : s.label;
              const isActive = filterStatuses.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter('status', key)}
                  className={`relative rounded-xl px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-glow-brand/20 scale-105'
                      : 'bg-white/[0.02] text-white/20 border border-white/5 hover:bg-white/5 hover:text-white/40'
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operator Channel */}
        <div className="relative group/operator">
          <select
            value={filterAssignee}
            onChange={(event) => setFilterAssignee(event.target.value)}
            className="appearance-none rounded-[1.5rem] border border-white/5 bg-white/[0.02] pl-6 pr-12 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] focus:bg-white/[0.04] focus:text-white outline-none transition-all cursor-pointer shadow-inner italic"
            aria-label="Operator filter"
          >
            <option value="" className="bg-slate-950">
              SELECT_OPERATOR
            </option>
            {members.map((member) => (
              <option key={member.id} value={member.id} className="bg-slate-950 italic">
                {member.fullName.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/10">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>

        {/* Rank Channels */}
        <div className="flex flex-wrap items-center gap-3 rounded-[1.75rem] bg-slate-950/40 border border-white/5 px-5 py-3 shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 mr-2 italic">
            RANK
          </span>
          <div className="flex items-center gap-2">
            {PRIORITY_OPTIONS.map((priority) => {
              const isActive = filterPriorities.has(priority.key);
              return (
                <button
                  key={priority.key}
                  type="button"
                  onClick={() => toggleFilter('priority', priority.key)}
                  className={`rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-glow-indigo/20 scale-105'
                      : 'bg-white/[0.02] text-white/20 border border-white/5 hover:bg-white/5 hover:text-white/40'
                  }`}
                >
                  {priority.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Channels */}
        <div className="flex flex-wrap items-center gap-3 rounded-[1.75rem] bg-slate-950/40 border border-white/5 px-5 py-3 shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 mr-2 italic">
            CLASS
          </span>
          <div className="flex items-center gap-2">
            {TASK_TYPE_OPTIONS.map((taskType) => {
              const isActive = filterTypes.has(taskType.key);
              return (
                <button
                  key={taskType.key}
                  type="button"
                  onClick={() => toggleFilter('type', taskType.key)}
                  className={`rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-glow-emerald/20 scale-105'
                      : 'bg-white/[0.02] text-white/20 border border-white/5 hover:bg-white/5 hover:text-white/40'
                  }`}
                >
                  {taskType.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Protocol */}
        <div className="flex items-center gap-4 rounded-[1.75rem] bg-white/[0.01] border border-white/5 px-6 py-3 shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 italic">
            SORT_SEQ
          </span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as TaskSortBy)}
            className="bg-transparent text-[10px] font-black uppercase text-white/40 outline-none cursor-pointer hover:text-white transition-colors italic tracking-widest"
            aria-label="Sort Protocol"
          >
            <option value="" className="bg-slate-950">
              DEFAULT
            </option>
            <option value="dueDate" className="bg-slate-950">
              DUE_DATE
            </option>
            <option value="createdAt" className="bg-slate-950">
              INIT_DATE
            </option>
            <option value="priority" className="bg-slate-950">
              PRIORITY
            </option>
            <option value="storyPoints" className="bg-slate-950">
              POINTS
            </option>
          </select>
          {sortBy ? (
            <button
              type="button"
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500 hover:text-white transition-all shadow-glow-brand/10 active:scale-90"
            >
              <span className="text-[8px] font-black tracking-tighter">
                {sortDir === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          ) : null}
        </div>

        {/* Archive Protocol */}
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-4 rounded-[1.75rem] border px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 italic overflow-hidden group/archive relative ${
            showArchived
              ? 'border-amber-500/40 bg-amber-500 text-white shadow-glow-amber/20 scale-105'
              : 'border-white/5 bg-white/[0.02] text-white/20 hover:bg-white/5 hover:text-white/40 hover:border-white/10'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full transition-all duration-500 ${showArchived ? 'bg-white shadow-glow-white animate-pulse' : 'bg-white/5 animate-ping'}`}
          />
          <span className="relative z-10">
            {showArchived ? 'ARCHIVE_OVERRIDE_ENABLED' : 'VIEW_ARCHIVE_VOID'}
          </span>
        </button>
      </div>
    </div>
  );
}
