'use client';

import { useParams } from 'next/navigation';
import { useDoc } from '@/features/docs/hooks/use-doc';
import { RichTextEditor } from '@/features/docs/components/RichTextEditor';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import {
  Cloud,
  Settings,
  History,
  UserPlus,
  MoreVertical,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { SectionError } from '@/components/ui/page-states';

export default function DocDetailPage() {
  const params = useParams<{ docId: string }>();
  const {
    data: doc,
    isLoading,
    isError,
    error,
    localTitle,
    setLocalTitle,
    localContent,
    setLocalContent,
    isSaving,
    refetch,
  } = useDoc(params.docId);

  if (isLoading) {
    return (
      <div className="p-12 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="h-10 w-3/4 bg-slate-100 rounded-md animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-50 rounded animate-pulse" />
          <div className="h-4 w-full bg-slate-50 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-slate-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-white">
        <SectionError
          title="Không thể tải tài liệu"
          message={error?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ.'}
          onAction={() => refetch()}
          actionLabel="Thử lại"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Editor Header */}
      <header className="flex h-12 shrink-0 items-center justify-between px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            {isSaving ? (
              <div className="flex items-center gap-1.5 text-brand-600 transition-all">
                <Loader2 size={12} className="animate-spin" />
                <span>Đang lưu...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 transition-all group">
                <CheckCircle2 size={12} className="group-hover:scale-110 transition-transform" />
                <span>Đã lưu</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-300 ml-2">
            <Cloud size={12} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 transition-colors text-[12px] font-bold">
            <UserPlus size={14} />
            <span>Chia sẻ</span>
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button className="p-1 hover:text-slate-600 transition-colors" title="Lịch sử phiên bản">
            <History size={18} />
          </button>
          <button className="p-1 hover:text-slate-600 transition-colors">
            <Settings size={18} />
          </button>
          <button className="p-1 hover:text-slate-600 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Main Editor Surface */}
      <div className="flex-1 overflow-y-auto px-6 py-12 scroll-smooth">
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-1000">
          {/* Title Editor */}
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Tiêu đề tài liệu..."
            className="w-full mb-8 text-4xl font-extrabold text-slate-900 border-none focus:outline-none placeholder:text-slate-200 transition-all font-display"
          />

          {/* Doc Metadata */}
          <div className="flex items-center gap-4 mb-10 text-[13px] text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <AssigneeAvatar
                name={doc?.creator?.fullName || 'Người dùng'}
                src={doc?.creator?.avatarUrl}
                size="sm"
              />
              <span>Tạo bởi {doc?.creator?.fullName}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <span>Chỉnh sửa: {new Date(doc?.updatedAt || '').toLocaleString('vi-VN')}</span>
          </div>

          {/* TipTap Editor */}
          <div className="min-h-[600px] pb-32">
            <RichTextEditor content={localContent} onChange={setLocalContent} />
          </div>
        </div>
      </div>
    </div>
  );
}
