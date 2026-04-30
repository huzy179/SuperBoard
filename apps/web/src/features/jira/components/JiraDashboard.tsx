'use client';

import { SectionError, SectionSkeleton } from '@/components/ui/page-states';
import { ProjectCardsGrid } from '@/features/operations/project/components/project-cards-grid';
import { ProjectForm } from '@/features/operations/project/components/project-form';
import { useJiraProjectsPage } from '../hooks';
import { useAuthSession } from '@/features/system/auth/hooks/use-auth-session';
import { NeuralWorkspaceDigest } from '@/features/intelligence/ai/components/neural-workspace-digest';
import { Search, Star, SortAsc, Zap, Plus, LayoutGrid, History, Activity } from 'lucide-react';

export function JiraDashboard() {
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
    handleCreateProject,
    createProjectPending,
    editingProject,
    openEditProject,
    closeEditProject,
    handleUpdateProject,
    updateProjectPending,
    archiveError,
    handleArchiveProject,
    isArchivingProject,
    toggleFavoriteProject,
    isFavoriteProject,
  } = useJiraProjectsPage();
  const { user } = useAuthSession();

  return (
    <div className="relative min-h-screen bg-surface-bg overflow-x-hidden pt-8 pb-16 px-6 md:px-10 font-sans">
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Workspace Hub Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-brand-500 rounded-full" />
              <span className="text-sm font-medium text-slate-600">Workspace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-none">
              Workspace hub
            </h1>
            <p className="text-sm text-slate-600 max-w-lg">
              {filteredProjects.length} projects in this workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreatePanel((value) => !value)}
            className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-brand-400 active:bg-brand-600 transition-colors"
          >
            <Plus size={16} />
            {showCreatePanel ? 'Close' : 'New project'}
          </button>
        </header>

        {/* Global Neural Digest */}
        {user?.defaultWorkspaceId && (
          <NeuralWorkspaceDigest workspaceId={user.defaultWorkspaceId} />
        )}

        {/* Command Gateway - Search & Filters */}
        <section className="rounded-lg border border-surface-border bg-surface-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 p-3">
            <div className="relative flex-1 min-w-[300px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-md border border-surface-border bg-surface-bg py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center gap-2 bg-surface-bg p-1 rounded-md border border-surface-border">
              <button
                type="button"
                onClick={() => setShowOnlyFavorites((value) => !value)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  showOnlyFavorites
                    ? 'bg-brand-500/10 text-brand-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.03]'
                }`}
              >
                <Star size={14} fill={showOnlyFavorites ? 'currentColor' : 'transparent'} />
                Favorites ({favoriteCount})
              </button>

              <div className="relative">
                <SortAsc
                  size={12}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] pointer-events-none"
                />
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
                  className="bg-transparent border-none pl-10 pr-8 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 focus:ring-0 cursor-pointer appearance-none transition-colors"
                  aria-label="Sort configuration"
                >
                  <option value="updated_desc">Updated (newest)</option>
                  <option value="updated_asc">Updated (oldest)</option>
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="name_desc">Name (Z–A)</option>
                </select>
              </div>
            </div>

            <div className="h-8 w-px bg-surface-border mx-2" />

            <button
              type="button"
              onClick={() => {
                if (confirm('Deconstruct all remembered operational contexts?')) {
                  clearAllRememberedContexts();
                }
              }}
              disabled={rememberedContextCount === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-0"
            >
              <History size={12} />
              Reset ({rememberedContextCount})
            </button>
          </div>
        </section>

        {/* Mission Specification Form */}
        {showCreatePanel && (
          <div className="animate-in fade-in slide-in-from-top-6 duration-500">
            <ProjectForm
              mode="create"
              isPending={createProjectPending}
              onCancel={() => setShowCreatePanel(false)}
              onSubmit={handleCreateProject}
            />
          </div>
        )}

        {editingProject && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <ProjectForm
              mode="edit"
              initialValues={{
                name: editingProject.name,
                description: editingProject.description ?? '',
                icon: editingProject.icon ?? '📌',
                color: editingProject.color ?? '#2563eb',
              }}
              isPending={updateProjectPending}
              onCancel={closeEditProject}
              onSubmit={handleUpdateProject}
            />
          </div>
        )}

        {/* Error Handling */}
        {archiveError && (
          <div
            role="alert"
            className="p-4 rounded-lg border border-rose-200 bg-rose-50 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-3 text-rose-700">
              <Zap size={20} />
              <span className="text-sm font-medium">Error: {archiveError}</span>
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
            <div className="p-12 border border-dashed border-surface-border rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-surface-card">
              <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/15">
                <LayoutGrid size={28} className="text-brand-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">No projects yet</h3>
                <p className="text-sm text-slate-600">
                  Create your first project to start organizing work.
                </p>
              </div>
              <button
                onClick={() => setShowCreatePanel(true)}
                className="px-5 py-2.5 bg-brand-500 rounded-md text-sm font-semibold text-slate-950 hover:bg-brand-400 transition-colors"
              >
                New project
              </button>
            </div>
          ) : (
            <div className="space-y-16">
              {projectsUpdatedToday.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Activity size={14} className="text-slate-500" />
                      Updated today
                    </h3>
                    <div className="h-px flex-1 bg-surface-border" />
                    <span className="text-sm text-slate-500">{projectsUpdatedToday.length}</span>
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
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <History size={14} className="text-slate-500" />
                      Earlier
                    </h3>
                    <div className="h-px flex-1 bg-surface-border" />
                    <span className="text-sm text-slate-500">{projectsUpdatedEarlier.length}</span>
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
