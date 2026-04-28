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
        <nav className="flex space-x-12 relative z-10">
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
      <div className="max-w-4xl space-y-12">
        {activeTab === 'profile' && (
          <div>
            <section className="rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe">
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
                      className="group relative flex items-center gap-4 bg-white px-12 py-5 rounded-full text-slate-950 font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-luxe overflow-hidden disabled:opacity-30"
                    >
                      <div className="absolute inset-0 bg-brand-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                        {updateProfile.isPending ? (
                          <Cpu className="animate-spin" size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                        {updateProfile.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'workspace' && workspaceId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative rounded-[3rem] border border-white/5 bg-slate-900/40 p-4 shadow-glass backdrop-blur-3xl overflow-hidden group">
              <WorkspaceMemberSettings workspaceId={workspaceId} currentUserId={user?.id || ''} />
            </section>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative rounded-[3rem] border border-white/5 bg-slate-900/40 p-12 shadow-glass backdrop-blur-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
              <div className="relative z-10 space-y-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        Cài đặt thông báo
                      </h2>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                        Chọn loại sự kiện bạn muốn nhận qua email.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => updatePrefs.mutate({ emailEnabled: !preferences?.emailEnabled })}
                    className={`relative w-16 h-8 rounded-full transition-all duration-500 p-1 ${
                      preferences?.emailEnabled ? 'bg-brand-500 shadow-glow-brand' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full bg-white transition-all duration-500 shadow-luxe ${
                        preferences?.emailEnabled ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-4 pt-10 border-t border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 pl-4">
                    Loại sự kiện
                  </label>
                  <div className="grid gap-4">
                    {NOTIFICATION_TOGGLE_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (preferences?.emailEnabled) {
                            updatePrefs.mutate({
                              [item.id]: !isNotificationToggleEnabled(preferences, item.id),
                            });
                          }
                        }}
                        className={`flex items-center justify-between p-6 rounded-xl border transition-all cursor-pointer group ${
                          isNotificationToggleEnabled(preferences, item.id)
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-transparent border-white/5 opacity-40 grayscale'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className={`p-4 rounded-lg transition-all ${
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (preferences as any)?.[item.id]
                                ? 'bg-brand-500 text-slate-950 shadow-glow-brand'
                                : 'bg-white/5 text-white/20'
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-wider">
                              {item.label}
                            </p>
                            <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest leading-none mt-1">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-lg border-2 transition-all flex items-center justify-center ${
                            isNotificationToggleEnabled(preferences, item.id)
                              ? 'border-brand-500 bg-brand-500 text-slate-950'
                              : 'border-white/10'
                          }`}
                        >
                          {isNotificationToggleEnabled(preferences, item.id) && <Check size={14} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'workflows' && canChangeRoles && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative rounded-[3rem] border border-white/5 bg-slate-900/40 shadow-glass backdrop-blur-3xl overflow-hidden group">
              <WorkflowEditor
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
                    onClick={() =>
                      confirm('Áp dụng quy trình này cho toàn bộ dự án trong workspace?') &&
                      syncWorkflow.mutate()
                    }
                    disabled={syncWorkflow.isPending}
                    className="px-8 py-3 bg-white/[0.03] border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-500 hover:text-slate-950 hover:border-brand-500 transition-all shadow-luxe"
                  >
                    {syncWorkflow.isPending ? 'Đang đồng bộ...' : 'Đồng bộ cho toàn workspace'}
                  </button>
                }
              />
            </section>
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
