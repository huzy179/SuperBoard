'use client';

import { EmptyStateCard, SectionError, SectionSkeleton } from '@/components/ui/page-states';
import { ProjectCardsGrid } from '@/components/jira/project-cards-grid';
import { ProjectForm } from '@/components/jira/project-form';
import { useJiraProjectsPage } from '@/hooks/use-jira-projects-page';

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
    favoriteCount,
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Các dự án của bạn</h2>
          <p className="mt-2 text-slate-600">
            Quản lý và theo dõi tiến độ các dự án đang triển khai
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreatePanel((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <span>+</span>
          {showCreatePanel ? 'Đóng form' : 'Tạo dự án'}
        </button>
      </div>

      {/* Search + quick filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm dự án theo tên, mã hoặc mô tả..."
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={() => setShowOnlyFavorites((value) => !value)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showOnlyFavorites
              ? 'bg-amber-100 text-amber-700'
              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>{showOnlyFavorites ? '★' : '☆'}</span>
          Dự án ghim ({favoriteCount})
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
          <ProjectCardsGrid
            projects={filteredProjects}
            onOpenCreate={() => setShowCreatePanel(true)}
            onOpenEdit={openEditProject}
            onArchive={(projectId) => {
              void handleArchiveProject(projectId);
            }}
            isArchivingProject={isArchivingProject}
            onToggleFavorite={toggleFavoriteProject}
            isFavorite={isFavoriteProject}
          />
        )}
      </div>
    </section>
  );
}
