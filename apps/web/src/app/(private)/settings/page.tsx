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
    return <FullPageLoader label="Establishing Secure Connection..." />;

  if (isError) {
    return (
      <FullPageError
        title="Access Protocol Failed"
        message={error?.message ?? 'Unknown system error encountered'}
        actionLabel="Re-Authenticate"
        onAction={() => window.location.reload()}
      />
    );
  }

  const currentMember = members?.find((m) => m.userId === user?.id);
  const canChangeRoles = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  return (
    <section className="animate-in fade-in duration-1000 pb-20">
      <div className="mb-12 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-brand-400" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
              Core Interface
            </span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Control Center
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="group relative flex items-center gap-3 bg-white/[0.03] border border-white/5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/5 hover:border-brand-500/30 transition-all shadow-luxe"
        >
          <div className="p-1 bg-white/5 rounded-lg group-hover:bg-brand-500 group-hover:text-slate-950 transition-colors">
            <Plus size={14} />
          </div>
          Initialize Workspace
        </button>
      </div>

      <div className="mb-12 relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
        <nav className="flex space-x-12 relative z-10">
          {[
            { id: 'profile', label: 'Operator Identity', icon: <User size={14} /> },
            { id: 'workspace', label: 'Nodes & Ops', icon: <Users size={14} /> },
            { id: 'notifications', label: 'Signal Config', icon: <Bell size={14} /> },
            ...(canChangeRoles
              ? [{ id: 'workflows', label: 'Neural Protocols', icon: <Workflow size={14} /> }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as 'profile' | 'workspace' | 'notifications' | 'workflows')
              }
              className={`relative flex items-center gap-3 pb-6 px-1 font-black text-[11px] uppercase tracking-[0.2em] transition-all group ${
                activeTab === tab.id ? 'text-brand-400' : 'text-white/20 hover:text-white/60'
              }`}
            >
              <div
                className={`transition-all duration-500 ${activeTab === tab.id ? 'text-brand-500 animate-pulse' : 'text-white/10 group-hover:text-brand-400'}`}
              >
                {tab.icon}
              </div>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-500 rounded-full shadow-glow-brand animate-in slide-in-from-bottom-2" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl space-y-12">
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative rounded-[3rem] border border-white/5 bg-slate-900/40 p-12 shadow-glass backdrop-blur-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
              <div className="relative z-10 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20 text-brand-400">
                    <Target size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    Operator Identity
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
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 pl-4">
                      DESIGNATION
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-[2rem] px-8 py-5 text-sm font-bold text-white placeholder:text-white/5 focus:outline-none focus:border-brand-500 transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 pl-4">
                      ENCRYPTED EMAIL
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full bg-slate-950 border border-white/5 rounded-[2rem] px-8 py-5 text-sm font-bold text-white/20 cursor-not-allowed shadow-inner"
                      />
                      <Shield
                        size={14}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-white/5"
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
                        {updateProfile.isPending ? 'SYNCING...' : 'UPDATE IDENTITY'}
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
                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        Signal Config
                      </h2>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                        Configure telemetry relay protocols.
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
                    TRIGGER EVENTS
                  </label>
                  <div className="grid gap-4">
                    {[
                      {
                        id: 'taskAssignedEmail',
                        label: 'Vector Authorization',
                        desc: 'You are designated as the primary operator for a new mission vector.',
                        icon: <Target size={18} />,
                      },
                      {
                        id: 'workspaceInviteEmail',
                        label: 'Namespace Invitation',
                        desc: 'Receive access requests to establish connection with external node clusters.',
                        icon: <Mail size={18} />,
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (preferences?.emailEnabled) {
                            updatePrefs.mutate({
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              [item.id]: !(preferences as any)?.[item.id],
                            });
                          }
                        }}
                        className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all cursor-pointer group ${
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (preferences as any)?.[item.id]
                            ? 'bg-white/[0.04] border-white/10'
                            : 'bg-transparent border-white/5 opacity-40 grayscale'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className={`p-4 rounded-2xl transition-all ${
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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (preferences as any)?.[item.id]
                              ? 'border-brand-500 bg-brand-500 text-slate-950'
                              : 'border-white/10'
                          }`}
                        >
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(preferences as any)?.[item.id] && <Check size={14} />}
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={workflow as any}
                isLoading={isWorkflowLoading}
                title="Universal Protocol Manifest"
                description="Establish default status vectors and transition logic for all workspace mission blocks."
                onAddStatus={(data) => createWorkspaceStatus.mutateAsync(data)}
                onUpdateStatus={(statusId, data) =>
                  updateWorkspaceStatus.mutateAsync({ statusId, data })
                }
                onDeleteStatus={async (statusId) => {
                  if (confirm('De-authorize mission status status?')) {
                    await deleteWorkspaceStatus.mutateAsync({ statusId });
                  }
                }}
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
                      confirm('TRANSMIT GLOBAL PROTOCOL OVERWRITE TO ALL NODES?') &&
                      syncWorkflow.mutate()
                    }
                    disabled={syncWorkflow.isPending}
                    className="px-8 py-3 bg-white/[0.03] border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-500 hover:text-slate-950 hover:border-brand-500 transition-all shadow-luxe"
                  >
                    {syncWorkflow.isPending ? 'TRANSMITTING...' : 'Propagate to System'}
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
