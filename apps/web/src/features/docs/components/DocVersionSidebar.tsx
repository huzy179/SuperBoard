'use client';

import { useDocVersions } from '../hooks/use-doc';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { History, X, RotateCcw, Clock, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface DocVersionSidebarProps {
  docId: string;
  onClose: () => void;
  onRestore: (content: any) => void;
}

export function DocVersionSidebar({ docId, onClose, onRestore }: DocVersionSidebarProps) {
  const { data: versions, isLoading } = useDocVersions(docId);

  return (
    <div className="w-80 border-l border-slate-100 bg-slate-50/50 flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <History size={16} className="text-brand-500" />
          <span>Lịch sử phiên bản</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-brand-500" />
            <span className="text-xs font-medium">Đang tải lịch sử...</span>
          </div>
        ) : versions?.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Clock size={20} />
            </div>
            <p className="text-sm text-slate-500 font-medium">Chưa có phiên bản nào được lưu</p>
          </div>
        ) : (
          versions?.map((version) => (
            <div
              key={version.id}
              className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-sm transition-all cursor-default"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-slate-900 leading-tight">
                    {format(new Date(version.savedAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
                    <User size={10} />
                    <span>Hệ thống tự động</span>
                  </div>
                </div>
                <button
                  onClick={() => onRestore(version.content)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-all active:scale-90"
                  title="Khôi phục phiên bản này"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <div className="text-[10px] text-slate-400 line-clamp-2 px-2 py-1 bg-slate-50 rounded-md border border-slate-100/50">
                Phiên bản lưu trữ tại thời điểm này
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
          SuperBoard tự động lưu phiên bản khi có thay đổi quan trọng trên tài liệu của bạn.
        </p>
      </div>
    </div>
  );
}
