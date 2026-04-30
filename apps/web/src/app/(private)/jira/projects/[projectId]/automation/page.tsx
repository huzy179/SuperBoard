'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { FullPageLoader } from '@/components/ui/page-states';
import { useProjectDetail } from '@/features/operations/board/hooks';
import { AutomationList } from '@/features/specialized/automation/components/AutomationList';
import { CreateRuleModal } from '@/features/specialized/automation/components/CreateRuleModal';
import { AIAutomationDialog } from '@/features/specialized/automation/components/AIAutomationDialog';

export default function AutomationPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const { data: project, isLoading } = useProjectDetail(projectId);
  if (isLoading) return <FullPageLoader label="Đang tải cấu hình..." />;

  const workspaceId = project?.workspaceId || '';

  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
            >
              <ArrowLeft size={16} />
              Quay lại dự án
            </button>

            <h1 className="text-3xl md:text-4xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-tight">
              Automation
            </h1>
            <p className="text-sm text-[color:var(--color-muted)] leading-relaxed max-w-2xl">
              Thiết lập rule tự động cho dự án{' '}
              <span className="font-semibold text-[color:var(--color-ink)]">{project?.name}</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              Tạo rule
            </span>
          </button>
        </header>

        <main className="mt-8 rounded-xl border border-surface-border bg-surface-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-surface-border px-6 py-4">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">
              Danh sách rule
            </div>
            <div className="text-sm text-[color:var(--color-muted)]">
              Workspace: {workspaceId || '—'}
            </div>
          </div>
          <div className="p-6 min-h-[360px]">
            <AutomationList workspaceId={workspaceId} projectId={projectId} />
          </div>
        </main>

        <section className="mt-8 rounded-xl border border-surface-border bg-brand-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                Tạo rule nhanh với AI
              </div>
              <p className="text-sm text-[color:var(--color-muted)] leading-relaxed max-w-2xl">
                Mô tả bằng ngôn ngữ tự nhiên, hệ thống sẽ gợi ý rule phù hợp để bạn duyệt và áp
                dụng.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAIDialog(true)}
              className="btn btn-secondary"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles size={16} className="text-brand-700" />
                Mở AI assistant
              </span>
            </button>
          </div>
        </section>
      </div>

      {showCreateModal ? (
        <CreateRuleModal
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}

      {showAIDialog ? (
        <AIAutomationDialog
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowAIDialog(false)}
        />
      ) : null}
    </div>
  );
}
