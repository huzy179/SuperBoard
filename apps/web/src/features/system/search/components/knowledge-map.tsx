'use client';

import { useState } from 'react';
import { X, Activity, BookOpen, RefreshCw, Zap } from 'lucide-react';
import { KnowledgeGraphView } from '@/features/intelligence/knowledge/components/knowledge-graph-view';
import { toast } from 'sonner';
import { generateKnowledgeDiary } from '@/features/intelligence/knowledge/api/knowledge-service';

interface KnowledgeMapProps {
  projectId: string;
  onClose: () => void;
  onSelectNode?: (nodeId: string, type: 'task' | 'doc' | 'user', label: string) => void;
}

export function KnowledgeMap({ projectId, onClose, onSelectNode }: KnowledgeMapProps) {
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);

  const handleGenerateDiary = async () => {
    setIsGeneratingDiary(true);
    try {
      await generateKnowledgeDiary(projectId);
      toast.success('Đã tạo nhật ký tuần thành công');
    } catch (err: unknown) {
      toast.error('Tạo thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-surface-bg font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-border bg-surface-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
            <Activity size={18} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-[color:var(--color-ink)]">Bản đồ tri thức</h2>
            <p className="text-sm text-[color:var(--color-muted)]">
              Xem tương quan giữa task, tài liệu và thành viên.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Action: Generate Diary */}
          <button
            onClick={handleGenerateDiary}
            disabled={isGeneratingDiary}
            className="btn btn-secondary"
          >
            {isGeneratingDiary ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <BookOpen size={16} />
            )}
            {isGeneratingDiary ? 'Đang tạo…' : 'Tạo nhật ký'}
          </button>

          <div className="w-px h-8 bg-surface-border" />

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Graph View */}
      <div className="flex-1 p-10 relative">
        <KnowledgeGraphView projectId={projectId} onSelectNode={onSelectNode} />

        {/* Semantic Sidebar / Overlay Hint */}
        <div className="absolute bottom-10 right-10 max-w-sm p-6 rounded-xl bg-surface-card border border-surface-border shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-brand-600" />
            <span className="text-sm font-semibold text-[color:var(--color-ink)]">Gợi ý</span>
          </div>
          <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
            Click vào node để xem tên. Bạn có thể chọn node để mở chi tiết (nếu được hỗ trợ ở màn
            hiện tại).
          </p>
        </div>
      </div>
    </div>
  );
}
