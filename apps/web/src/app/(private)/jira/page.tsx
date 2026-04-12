'use client';

import { SectionError, SectionSkeleton } from '@/components/ui/page-states';
import { ProjectCardsGrid } from '@/features/jira/components/project-cards-grid';
import { ProjectForm } from '@/features/jira/components/project-form';
import { useJiraProjectsPage } from '@/features/jira/hooks';
import { Search, Star, SortAsc, Zap, Plus, LayoutGrid, History, Activity } from 'lucide-react';

export default function JiraHomePage() {
  const {
    projectsLoading,
    projectsError,
    filteredProjects,
    reloadProjects,
    searchQuery,
    setSearchQuery,
    showOnlyFavorites,
    setShowOnlyFavorites,
    sortKey,
    setSortKey,
    favoriteCount,
    rememberedContextCount,
    projectsUpdatedToday,
    projectsUpdatedEarlier,
    getProjectOpenHref,
    hasRememberedContext,
    clearProjectRememberedContext,
    clearAllRememberedContexts,
    showCreatePanel,
    setShowCreatePanel,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    projectIcon,
    setProjectIcon,
    projectColor,
    setProjectColor,
    createError,
    handleCreateProject,
    createProjectPending,
    editingProject,
    openEditProject,
    closeEditProject,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editIcon,
    setEditIcon,
    editColor,
    setEditColor,
    editError,
    handleUpdateProject,
    updateProjectPending,
    archiveError,
    handleArchiveProject,
    isArchivingProject,
    toggleFavoriteProject,
    isFavoriteProject,
  } = useJiraProjectsPage();

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-x-hidden pt-10 pb-24 px-8 md:px-12 font-sans">
      {/* Mesh Gradients */}
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none opacity-50" />
      <div className="fixed -bottom-40 -left-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Workspace Hub Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-brand-500 rounded-full shadow-glow-brand" />
              <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.4em]">
                Integrated Environment
              </span>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
              Workspace Hub
            </h1>
            <p className="text-sm font-medium text-white/30 tracking-wide max-w-lg italic">
              Synchronizing {filteredProjects.length} active operational nodes across the neural
              workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreatePanel((value) => !value)}
            className="group relative flex items-center gap-3 bg-white px-8 py-4 rounded-[2rem] text-slate-950 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-luxe overflow-hidden"
          >
            <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
              <Plus size={16} />
              {showCreatePanel ? 'Close Specifications' : 'Initialize Node'}
            </span>
          </button>
        </header>

        {/* Command Gateway - Search & Filters */}
        <section className="p-2 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-glass">
          <div className="flex flex-wrap items-center gap-4 p-2">
            <div className="relative flex-1 min-w-[300px] group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-brand-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH NODES BY DESIGNATION OR PROTOCOL..."
                className="w-full bg-slate-900/50 border border-white/5 rounded-full py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-brand-500/50 transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-full border border-white/5">
              <button
                type="button"
                onClick={() => setShowOnlyFavorites((value) => !value)}
                className={`flex items-center gap-2 rounded-full px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${
                  showOnlyFavorites
                    ? 'bg-amber-500 text-white shadow-glow-amber scale-105'
                    : 'text-white/30 hover:text-white hover:bg-white/5'
                }`}
              >
                <Star size={12} fill={showOnlyFavorites ? 'white' : 'transparent'} />
                Prioritized ({favoriteCount})
              </button>

              <div className="relative">
                <SortAsc
                  size={12}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
                />
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
                  className="bg-transparent border-none pl-10 pr-8 py-3 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white focus:ring-0 cursor-pointer appearance-none transition-colors"
                  aria-label="Sort configuration"
                >
                  <option value="updated_desc">LATENCY: DESC</option>
                  <option value="updated_asc">LATENCY: ASC</option>
                  <option value="name_asc">NODE: A-Z</option>
                  <option value="name_desc">NODE: Z-A</option>
                </select>
              </div>
            </div>

            <div className="h-8 w-px bg-white/5 mx-2" />

            <button
              type="button"
              onClick={() => {
                if (confirm('Deconstruct all remembered operational contexts?')) {
                  clearAllRememberedContexts();
                }
              }}
              disabled={rememberedContextCount === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-rose-400 hover:bg-rose-500/5 transition-all disabled:opacity-0"
            >
              <History size={12} />
              Reset Context ({rememberedContextCount})
            </button>
          </div>
        </section>

        {/* Mission Specification Form */}
        {showCreatePanel && (
          <div className="animate-in fade-in slide-in-from-top-6 duration-500">
            <ProjectForm
              mode="create"
              name={projectName}
              description={projectDescription}
              icon={projectIcon}
              color={projectColor}
              error={createError}
              isPending={createProjectPending}
              onNameChange={setProjectName}
              onDescriptionChange={setProjectDescription}
              onIconChange={setProjectIcon}
              onColorChange={setProjectColor}
              onCancel={() => setShowCreatePanel(false)}
              onSubmit={handleCreateProject}
            />
          </div>
        )}

        {editingProject && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <ProjectForm
              mode="edit"
              name={editName}
              description={editDescription}
              icon={editIcon}
              color={editColor}
              error={null}
              isPending={updateProjectPending}
              onNameChange={setEditName}
              onDescriptionChange={setEditDescription}
              onIconChange={setEditIcon}
              onColorChange={setEditColor}
              onCancel={closeEditProject}
              onSubmit={handleUpdateProject}
            />
          </div>
        )}

        {/* Error Handling */}
        {(editError || archiveError) && (
          <div
            role="alert"
            className="p-6 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 backdrop-blur-3xl animate-in shake duration-500"
          >
            <div className="flex items-center gap-4 text-rose-400">
              <Zap size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Initialization Error: {editError || archiveError}
              </span>
            </div>
          </div>
        )}

        {/* Operational Grid */}
        <section className="space-y-12">
          {projectsLoading ? (
            <SectionSkeleton rows={6} />
          ) : projectsError ? (
            <SectionError
              title="MISSION GRID FAILURE"
              message={projectsError}
              actionLabel="RETRY CONNECT"
              onAction={reloadProjects}
            />
          ) : filteredProjects.length === 0 ? (
            <div className="p-20 border border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-8 bg-white/5 rounded-full animate-pulse border border-white/5">
                <LayoutGrid size={48} className="text-white/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                  Zero Nodes Detected
                </h3>
                <p className="text-sm text-white/20 uppercase tracking-widest">
                  Workspace is currently offline. Initialize a mission node to begin.
                </p>
              </div>
              <button
                onClick={() => setShowCreatePanel(true)}
                className="px-8 py-3 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-slate-950 hover:bg-brand-500 hover:text-white transition-colors"
              >
                Initialize First Node
              </button>
            </div>
          ) : (
            <div className="space-y-16">
              {projectsUpdatedToday.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-brand-400 uppercase tracking-[0.5em] flex items-center gap-3">
                      <Activity size={14} className="animate-pulse" />
                      Active Vector (Today)
                    </h3>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      {projectsUpdatedToday.length} Nodes
                    </span>
                  </div>
                  <ProjectCardsGrid
                    projects={projectsUpdatedToday}
                    onOpenCreate={() => setShowCreatePanel(true)}
                    onOpenEdit={openEditProject}
                    onArchive={(projectId) => {
                      void handleArchiveProject(projectId);
                    }}
                    isArchivingProject={isArchivingProject}
                    onToggleFavorite={toggleFavoriteProject}
                    isFavorite={isFavoriteProject}
                    getProjectOpenHref={getProjectOpenHref}
                    onClearRememberedContext={clearProjectRememberedContext}
                    hasRememberedContext={hasRememberedContext}
                    showCreateCard={projectsUpdatedEarlier.length === 0}
                  />
                </div>
              )}

              {projectsUpdatedEarlier.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] flex items-center gap-3">
                      <History size={14} />
                      Stable Nodes (Earlier)
                    </h3>
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      {projectsUpdatedEarlier.length} Nodes
                    </span>
                  </div>
                  <ProjectCardsGrid
                    projects={projectsUpdatedEarlier}
                    onOpenCreate={() => setShowCreatePanel(true)}
                    onOpenEdit={openEditProject}
                    onArchive={(projectId) => {
                      void handleArchiveProject(projectId);
                    }}
                    isArchivingProject={isArchivingProject}
                    onToggleFavorite={toggleFavoriteProject}
                    isFavorite={isFavoriteProject}
                    getProjectOpenHref={getProjectOpenHref}
                    onClearRememberedContext={clearProjectRememberedContext}
                    hasRememberedContext={hasRememberedContext}
                    showCreateCard
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
