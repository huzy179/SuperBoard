'use client';

import { useState, type ReactNode } from 'react';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { useAuthSession } from '@/features/system/auth/hooks';
import { useUpdateProfile } from '@/features/system/user/hooks/user-profile';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/system/notifications/hooks/notification-preferences';
import { useWorkspaceMembers, useWorkspace } from '@/features/system/workspace/hooks';
import {
  useWorkspaceWorkflow,
  useCreateWorkspaceStatus,
  useUpdateWorkspaceStatus,
  useDeleteWorkspaceStatus,
  useUpdateWorkspaceTransitions,
  useSyncWorkspaceWorkflow,
} from '@/features/operations/workflow/hooks/use-workflow';
import { WorkflowEditor } from '@/features/operations/workflow/components/WorkflowEditor';
import { WorkspaceCreateModal } from '@/features/system/workspace/components/WorkspaceCreateModal';
import { AvatarUpload } from '@/features/system/user/components/AvatarUpload';
import { WorkspaceMemberSettings } from '@/features/system/workspace/components/WorkspaceMemberSettings';
import {
  Shield,
  User,
  Users,
  Bell,
  Workflow,
  Plus,
  Check,
  ShieldCheck,
  Cpu,
  Mail,
  Zap,
  Target,
} from 'lucide-react';
import type {
  NotificationPreferenceDTO,
  UpdateNotificationPreferenceRequestDTO,
} from '@superboard/shared';

const NOTIFICATION_TOGGLE_ITEMS: Array<{
  id: keyof Pick<
    UpdateNotificationPreferenceRequestDTO,
    'taskAssignedEmail' | 'workspaceInviteEmail'
  >;
  label: string;
  desc: string;
  icon: ReactNode;
}> = [
  {
    id: 'taskAssignedEmail',
    label: 'Thông báo công việc mới',
    desc: 'Nhận email khi bạn được giao một công việc mới.',
    icon: <Target size={18} />,
  },
  {
    id: 'workspaceInviteEmail',
    label: 'Thông báo mời vào workspace',
    desc: 'Nhận email khi có lời mời tham gia workspace.',
    icon: <Mail size={18} />,
  },
];

function isNotificationToggleEnabled(
  preferences: NotificationPreferenceDTO | undefined,
  key: keyof Pick<
    UpdateNotificationPreferenceRequestDTO,
    'taskAssignedEmail' | 'workspaceInviteEmail'
  >,
): boolean {
  return preferences?.[key] ?? false;
}

export default function SettingsPage() {
  const { user } = useAuthSession();
  const workspaceId = user?.defaultWorkspaceId;
  const {
    data: members,
    isLoading,
    isError,
    error,
  } = useWorkspaceMembers(workspaceId ?? undefined);

  const { isLoading: isWorkspaceLoading } = useWorkspace(workspaceId ?? undefined);

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
  const { data: preferences } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [profileName, setProfileName] = useState(user?.fullName || '');

  if (isLoading || isWorkspaceLoading || (activeTab === 'workflows' && isWorkflowLoading))
    return <FullPageLoader label="Đang kết nối dữ liệu..." />;

  if (isError) {
    return (
      <FullPageError
        title="Không thể truy cập cài đặt"
        message={error?.message ?? 'Đã xảy ra lỗi hệ thống'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );
  }

  const currentMember = members?.find((m) => m.userId === user?.id);
  const canChangeRoles = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  return (
    <section className="pb-20">
      <div className="mb-12 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-brand-500" />
            <span className="text-sm font-medium text-[color:var(--color-muted)]">
              Thiết lập hệ thống
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-tight">
            Cài đặt
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="group relative inline-flex items-center gap-2 bg-brand-500 text-white border border-transparent px-4 py-2 rounded-button text-sm font-medium hover:bg-brand-600 transition-colors shadow-luxe"
        >
          <div className="p-1 bg-white/15 rounded-sm">
            <Plus size={14} />
          </div>
          Tạo workspace
        </button>
      </div>

      <div className="mb-12 relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-surface-border" />
        <nav className="flex gap-10 overflow-x-auto elite-scrollbar scrollbar-hide relative z-10">
          {[
            { id: 'profile', label: 'Hồ sơ cá nhân', icon: <User size={14} /> },
            { id: 'workspace', label: 'Thành viên workspace', icon: <Users size={14} /> },
            { id: 'notifications', label: 'Thông báo', icon: <Bell size={14} /> },
            ...(canChangeRoles
              ? [{ id: 'workflows', label: 'Quy trình công việc', icon: <Workflow size={14} /> }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'profile' | 'workspace' | 'notifications' | 'workflows')
              }
              className={`relative flex items-center gap-3 pb-4 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[color:var(--color-ink)]'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
              }`}
            >
              <div
                className={`${activeTab === tab.id ? 'text-brand-500' : 'text-[color:var(--color-muted)]'}`}
              >
                {tab.icon}
              </div>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="w-full space-y-10">
        {activeTab === 'profile' && (
          <div>
            <section className="rounded-xl border border-surface-border bg-surface-card p-6 md:p-8 shadow-luxe">
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 rounded-lg border border-brand-500/15 text-brand-500">
                    <Target size={20} />
                  </div>
                  <h2 className="text-2xl font-semibold text-[color:var(--color-ink)] tracking-tight">
                    Hồ sơ cá nhân
                  </h2>
                </div>

                {user && <AvatarUpload user={user} />}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateProfile.mutate({ fullName: profileName });
                  }}
                  className="grid gap-10 md:grid-cols-2"
                >
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-[color:var(--color-muted)] px-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="form-input-lg"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-[color:var(--color-muted)] px-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="form-input-lg opacity-60 cursor-not-allowed"
                      />
                      <Shield
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)]"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfile.isPending || profileName === user?.fullName}
                      className="btn btn-primary disabled:opacity-40"
                    >
                      <span className="inline-flex items-center gap-2">
                        {updateProfile.isPending ? (
                          <Cpu className="animate-spin" size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                        {updateProfile.isPending ? 'Đang lưu…' : 'Lưu thông tin'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'workspace' && workspaceId && (
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm">
            <WorkspaceMemberSettings workspaceId={workspaceId} currentUserId={user?.id || ''} />
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 md:p-8 shadow-sm">
            <div className="space-y-10">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-50 rounded-lg border border-brand-500/15 text-brand-700">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[color:var(--color-ink)]">
                      Thông báo
                    </h2>
                    <p className="text-sm text-[color:var(--color-muted)] leading-relaxed mt-1">
                      Chọn loại sự kiện bạn muốn nhận qua email.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updatePrefs.mutate({ emailEnabled: !preferences?.emailEnabled })}
                  className={`relative h-8 w-14 rounded-full border transition-colors ${
                    preferences?.emailEnabled
                      ? 'bg-brand-500 border-brand-500'
                      : 'bg-black/[0.06] border-surface-border'
                  }`}
                  aria-pressed={!!preferences?.emailEnabled}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                      preferences?.emailEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3 pt-8 border-t border-surface-border">
                <div className="text-xs font-medium text-[color:var(--color-muted)] px-1">
                  Loại sự kiện
                </div>

                <div className="grid gap-3">
                  {NOTIFICATION_TOGGLE_ITEMS.map((item) => {
                    const enabled = isNotificationToggleEnabled(preferences, item.id);
                    const locked = !preferences?.emailEnabled;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={locked}
                        onClick={() => {
                          if (!locked) {
                            updatePrefs.mutate({
                              [item.id]: !enabled,
                            });
                          }
                        }}
                        className={`flex items-center justify-between gap-4 rounded-lg border p-5 text-left transition-colors disabled:opacity-40 ${
                          enabled
                            ? 'bg-brand-50 border-brand-200'
                            : 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border ${
                              enabled
                                ? 'bg-white border-brand-200 text-brand-700'
                                : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)]'
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                              {item.label}
                            </div>
                            <div className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${
                            enabled
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-surface-border bg-surface-bg text-transparent'
                          }`}
                          aria-hidden
                        >
                          <Check size={14} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'workflows' && canChangeRoles && (
          <WorkflowEditor
            variant="embedded"
            {...(workflow ? { data: workflow } : {})}
            isLoading={isWorkflowLoading}
            title="Quy trình mặc định của workspace"
            description="Thiết lập trạng thái và luồng chuyển trạng thái cho tất cả dự án trong workspace."
            onAddStatus={async (data) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await createWorkspaceStatus.mutateAsync(data as any);
            }}
            onUpdateStatus={async (statusId, data) => {
              await updateWorkspaceStatus.mutateAsync({ statusId, data });
            }}
            onDeleteStatus={async (statusId) => {
              if (confirm('Bạn có chắc muốn xóa trạng thái này?')) {
                await deleteWorkspaceStatus.mutateAsync({ statusId });
              }
            }}
            onSaveTransitions={async (transitions) => {
              await updateWorkspaceTransitions.mutateAsync({ transitions });
            }}
            isPending={
              createWorkspaceStatus.isPending ||
              updateWorkspaceStatus.isPending ||
              deleteWorkspaceStatus.isPending ||
              updateWorkspaceTransitions.isPending ||
              syncWorkflow.isPending
            }
            extraActions={
              <button
                type="button"
                onClick={() =>
                  confirm('Áp dụng quy trình này cho toàn bộ dự án trong workspace?') &&
                  syncWorkflow.mutate()
                }
                disabled={syncWorkflow.isPending}
                className="btn btn-secondary"
              >
                {syncWorkflow.isPending ? 'Đang đồng bộ…' : 'Đồng bộ cho toàn workspace'}
              </button>
            }
          />
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
