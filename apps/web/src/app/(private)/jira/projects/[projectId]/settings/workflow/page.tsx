'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  useProjectWorkflow,
  useCreateProjectStatus,
  useUpdateProjectStatus,
  useDeleteProjectStatus,
  useUpdateProjectTransitions,
} from '@/features/jira/hooks';
import { useProjectDetail } from '@/features/jira/hooks';
import { WorkflowEditor } from '@/features/jira/components/WorkflowEditor';

export default function WorkflowSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const router = useRouter();

  const { data: project } = useProjectDetail(projectId);
  const { data: workflow, isLoading } = useProjectWorkflow(projectId);

  const createStatus = useCreateProjectStatus(projectId);
  const updateStatus = useUpdateProjectStatus(projectId);
  const deleteStatus = useDeleteProjectStatus(projectId);
  const updateTransitions = useUpdateProjectTransitions(projectId);

  const handleDeleteStatus = async (statusId: string) => {
    if (!workflow?.statuses) return;
    const migrateTo = workflow.statuses.find((s) => s.id !== statusId);
    if (!migrateTo) {
      toast.error('Dự án phải có ít nhất một trạng thái khác để chuyển đổi task sang.');
      return;
    }

    if (
      !confirm(
        `Xác nhận xoá trạng thái? Tất cả task hiện tại sẽ được chuyển sang "${migrateTo.name}".`,
      )
    ) {
      return;
    }

    try {
      await deleteStatus.mutateAsync({ statusId, data: { migrateToId: migrateTo.id } });
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link
          href={`/jira/projects/${projectId}`}
          className="hover:text-brand-600 transition-colors"
        >
          {project?.name ?? 'Dự án'}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Cấu hình Workflow</span>
      </nav>

      <WorkflowEditor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data={workflow as any}
        isLoading={isLoading}
        title="Workflow & Trạng thái"
        description="Tùy chỉnh các bước trong quy trình làm việc và quy tắc chuyển đổi trạng thái cho dự án này."
        onAddStatus={(data) =>
          createStatus.mutateAsync(data).then(() => {
            toast.success('Đã thêm trạng thái mới');
          })
        }
        onUpdateStatus={(statusId, data) =>
          updateStatus.mutateAsync({ statusId, data }).then(() => {
            toast.success('Đã cập nhật tên trạng thái');
          })
        }
        onDeleteStatus={handleDeleteStatus}
        onSaveTransitions={(transitions) =>
          updateTransitions.mutateAsync({ transitions }).then(() => {
            toast.success('Đã cập nhật quy tắc chuyển đổi');
          })
        }
        isPending={
          createStatus.isPending ||
          updateStatus.isPending ||
          deleteStatus.isPending ||
          updateTransitions.isPending
        }
        extraActions={
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Quay lại
          </button>
        }
      />
    </div>
  );
}
