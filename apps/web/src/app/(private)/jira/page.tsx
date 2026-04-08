'use client';

import { EmptyStateCard, SectionError, SectionSkeleton } from '@/components/ui/page-states';
import { ProjectCardsGrid } from '@/features/jira/components/project-cards-grid';
import { ProjectForm } from '@/features/jira/components/project-form';
import { useJiraProjectsPage } from '@/features/jira/hooks';

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
    <section>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Các dự án của bạn</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Quản lý và theo dõi tiến độ các dự án đang triển khai
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreatePanel((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-brand-700 hover:shadow-md"
        >
          <span>+</span>
          {showCreatePanel ? 'Đóng form' : 'Tạo dự án'}
        </button>
      </div>

      {/* Search + quick filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm dự án theo tên, mã hoặc mô tả..."
            className="w-full rounded-lg border border-surface-border bg-surface-card py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowOnlyFavorites((value) => !value)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-all ${
            showOnlyFavorites
              ? 'bg-amber-100 text-amber-700'
              : 'border border-surface-border bg-surface-card text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>{showOnlyFavorites ? '★' : '☆'}</span>
          Dự án ghim ({favoriteCount})
        </button>

        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
          className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-slate-700 shadow-sm"
          aria-label="Sắp xếp dự án"
        >
          <option value="updated_desc">Mới cập nhật trước</option>
          <option value="updated_asc">Cập nhật cũ trước</option>
          <option value="name_asc">Tên A-Z</option>
          <option value="name_desc">Tên Z-A</option>
        </select>

        <button
          type="button"
          onClick={() => {
            if (confirm('Xóa toàn bộ ngữ cảnh đã nhớ (view/filter/sort) của các project?')) {
              clearAllRememberedContexts();
            }
          }}
          disabled={rememberedContextCount === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset ngữ cảnh ({rememberedContextCount})
        </button>
      </div>

      {showCreatePanel ? (
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
      ) : null}

      {editingProject ? (
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
      ) : null}

      {editError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700"
        >
          {editError}
        </div>
      ) : null}

      {archiveError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700"
        >
          {archiveError}
        </div>
      ) : null}

      <div>
        {projectsLoading ? (
          <SectionSkeleton rows={6} />
        ) : projectsError ? (
          <SectionError
            title="Không thể tải danh sách dự án"
            message={projectsError}
            actionLabel="Thử lại"
            onAction={reloadProjects}
          />
        ) : filteredProjects.length === 0 ? (
          <EmptyStateCard
            title={showOnlyFavorites ? 'Chưa có dự án ghim' : 'Chưa có dự án nào'}
            description={
              showOnlyFavorites
                ? 'Hãy bấm Ghim ở một dự án để ưu tiên hiển thị tại đây'
                : 'Hãy tạo dự án mới để bắt đầu'
            }
            actionLabel={showOnlyFavorites ? 'Hiện tất cả dự án' : 'Tạo dự án'}
            onAction={() => {
              if (showOnlyFavorites) {
                setShowOnlyFavorites(false);
                return;
              }
              setShowCreatePanel(true);
            }}
          />
        ) : (
          <div className="space-y-6">
            {projectsUpdatedToday.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Cập nhật hôm nay</h3>
                  <span className="text-xs text-slate-500">
                    {projectsUpdatedToday.length} dự án
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
            ) : null}

            {projectsUpdatedEarlier.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Cũ hơn</h3>
                  <span className="text-xs text-slate-500">
                    {projectsUpdatedEarlier.length} dự án
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
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
