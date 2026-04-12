'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus } from 'lucide-react';
import { AutomationList } from '@/features/automation/components/AutomationList';
import { CreateRuleModal } from '@/features/automation/components/CreateRuleModal';
import { AIAutomationDialog } from '@/features/automation/components/AIAutomationDialog';
import { useProjectDetail } from '@/features/jira/hooks';
import { FullPageLoader } from '@/components/ui/page-states';

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
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors mb-4 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại dự án</span>
          </button>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-xl shadow-brand-600/20">
                  <Sparkles size={24} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                  Tự động hóa
                </h1>
              </div>
              <p className="text-lg text-slate-500 font-medium">
                Tối ưu quy trình của dự án{' '}
                <span className="text-slate-900 font-bold">{project?.name}</span> bằng các quy tắc
                thông minh.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-2xl shadow-slate-900/30 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-tight"
            >
              <Plus size={20} />
              <span>Tạo quy tắc mới</span>
            </button>
          </div>
        </header>

        <main className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Danh sách quy tắc hiện có
            </h2>
          </div>
          <div className="p-8">
            <AutomationList workspaceId={workspaceId} projectId={projectId} />
          </div>
        </main>

        <footer className="mt-8 p-8 bg-slate-900 rounded-3xl text-white flex items-center justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 tracking-tight">Cần hỗ trợ từ AI?</h3>
            <p className="text-slate-400 font-medium max-w-md">
              Sử dụng SuperBoard AI để tự động tạo ra các quy tắc phức tạp chỉ bằng ngôn ngữ tự
              nhiên.
            </p>
          </div>
          <button
            onClick={() => setShowAIDialog(true)}
            className="relative z-10 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl hover:bg-brand-50 transition-all flex items-center gap-2 active:scale-95 uppercase tracking-tight"
          >
            <Sparkles size={18} className="text-brand-500" />
            <span>Hỏi AI Assistant</span>
          </button>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl group-hover:bg-brand-600/30 transition-all" />
        </footer>
      </div>

      {showCreateModal && (
        <CreateRuleModal
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showAIDialog && (
        <AIAutomationDialog
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={() => setShowAIDialog(false)}
        />
      )}
    </div>
  );
}
