'use client';

import { useState } from 'react';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { useAuthSession } from '@/features/auth/hooks';
import { useUpdateProfile } from '@/features/user/hooks/user-profile';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/hooks/notification-preferences';
import { useWorkspaceMembers, useWorkspace } from '@/features/workspace/hooks';
import {
  useWorkspaceWorkflow,
  useCreateWorkspaceStatus,
  useUpdateWorkspaceStatus,
  useDeleteWorkspaceStatus,
  useUpdateWorkspaceTransitions,
  useSyncWorkspaceWorkflow,
} from '@/features/jira/hooks/use-workflow';
import { WorkflowEditor } from '@/features/jira/components/WorkflowEditor';
import { WorkspaceCreateModal } from '@/features/workspace/components/WorkspaceCreateModal';
import { AvatarUpload } from '@/components/user/AvatarUpload';
import { WorkspaceMemberSettings } from '@/features/workspace/components/WorkspaceMemberSettings';

export default function SettingsPage() {
  const { user } = useAuthSession();
  const workspaceId = user?.defaultWorkspaceId;
  const {
    data: members,
    isLoading,
    isError,
    error,
  } = useWorkspaceMembers(workspaceId ?? undefined);

  useWorkspace(workspaceId ?? undefined);

  // Workflow hooks
  const { data: workflow, isLoading: isWorkflowLoading } = useWorkspaceWorkflow(workspaceId ?? '');
  const createWorkspaceStatus = useCreateWorkspaceStatus(workspaceId ?? '');
  const updateWorkspaceStatus = useUpdateWorkspaceStatus(workspaceId ?? '');
  const deleteWorkspaceStatus = useDeleteWorkspaceStatus(workspaceId ?? '');
  const updateWorkspaceTransitions = useUpdateWorkspaceTransitions(workspaceId ?? '');
  const syncWorkflow = useSyncWorkspaceWorkflow(workspaceId ?? '');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'workspace' | 'profile' | 'notifications' | 'workflows'
  >('profile');

  const updateProfile = useUpdateProfile();
  const { data: preferences, isLoading: isPrefsLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [profileName, setProfileName] = useState(user?.fullName || '');

  if (isLoading || isWorkspaceLoading || (activeTab === 'workflows' && isWorkflowLoading))
    return <FullPageLoader label="Đang tải cài đặt..." />;

  if (isError) {
    return (
      <FullPageError
        title="Không thể tải cài đặt"
        message={error?.message ?? 'Lỗi không xác định'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  const currentMember = members?.find((m) => m.userId === user?.id);
  const canChangeRoles = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  return (
    <section className="animate-fade-in pb-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          Cài đặt hệ thống
        </h1>
      </div>

      <div className="mb-10 border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', label: 'Hồ sơ cá nhân' },
            { id: 'workspace', label: 'Workspace & Team' },
            { id: 'notifications', label: 'Thông báo' },
            ...(canChangeRoles ? [{ id: 'workflows', label: 'Quy trình mẫu' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'profile' | 'workspace' | 'notifications' | 'workflows')
              }
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mb-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-brand-700 transition-all hover:bg-brand-100 active:scale-95"
          >
            + Create Workspace
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="premium-card p-8 space-y-8">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Thông tin cá nhân
              </h2>

              {user && <AvatarUpload user={user} />}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfile.mutate({ fullName: profileName });
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Email đăng nhập
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending || profileName === user?.fullName}
                    className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-black text-white hover:bg-black transition-all active:scale-95 disabled:opacity-50 uppercase tracking-tight"
                  >
                    {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {activeTab === 'workspace' && workspaceId && (
          <WorkspaceMemberSettings workspaceId={workspaceId} currentUserId={user?.id || ''} />
        )}

        {activeTab === 'notifications' && (
          <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="premium-card p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Email Notifications
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Quản lý cách SuperBoard liên lạc với bạn qua hòm thư.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences?.emailEnabled ?? true}
                  onChange={(e) => updatePrefs.mutate({ emailEnabled: e.target.checked })}
                  disabled={updatePrefs.isPending || isPrefsLoading}
                  className="h-6 w-11 rounded-full border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sự kiện thông báo
                </h3>

                {[
                  {
                    id: 'taskAssignedEmail',
                    label: 'Được giao công việc mới',
                    desc: 'Có ai đó gán bạn vào một thẻ công việc.',
                  },
                  {
                    id: 'workspaceInviteEmail',
                    label: 'Lời mời Workspace',
                    desc: 'Nhận thư mời gia nhập các tổ chức mới.',
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        ((preferences as Record<string, unknown>)?.[item.id] as boolean) ?? true
                      }
                      onChange={(e) => updatePrefs.mutate({ [item.id]: e.target.checked })}
                      disabled={
                        updatePrefs.isPending || isPrefsLoading || !preferences?.emailEnabled
                      }
                      className="h-5 w-5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'workflows' && canChangeRoles && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <WorkflowEditor
              data={workflow}
              isLoading={isWorkflowLoading}
              title="Quy trình mẫu chuẩn (Workspace Template)"
              description="Thiết lập trạng thái và quy tắc chuyển đổi mặc định. Mọi dự án mới sẽ được kế thừa từ đây."
              onAddStatus={(data) => createWorkspaceStatus.mutateAsync(data)}
              onUpdateStatus={(statusId, data) =>
                updateWorkspaceStatus.mutateAsync({ statusId, data })
              }
              onDeleteStatus={(statusId) =>
                confirm('Xoá trạng thái mẫu?') && deleteWorkspaceStatus.mutateAsync({ statusId })
              }
              onSaveTransitions={(transitions) =>
                updateWorkspaceTransitions.mutateAsync({ transitions })
              }
              isPending={
                createWorkspaceStatus.isPending ||
                updateWorkspaceStatus.isPending ||
                deleteWorkspaceStatus.isPending ||
                updateWorkspaceTransitions.isPending ||
                syncWorkflow.isPending
              }
              extraActions={
                <button
                  onClick={() =>
                    confirm('GHI ĐÈ quy trình của TẤT CẢ dự án hiện có?') && syncWorkflow.mutate()
                  }
                  disabled={syncWorkflow.isPending}
                  className="px-6 py-2.5 bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-brand-200 hover:bg-brand-100 transition-all"
                >
                  {syncWorkflow.isPending ? 'Đang đồng bộ...' : '🔄 Đồng bộ toàn hệ thống'}
                </button>
              }
            />
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <WorkspaceCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </section>
  );
}
