'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceDocs, createDoc } from '@/features/docs/api/doc-service';
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Clock,
  Trash2,
  Star,
} from 'lucide-react';
import { SectionSkeleton } from '@/components/ui/page-states';
import { toast } from 'sonner';
import type { Doc } from '@superboard/shared';

export default function DocLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const queryClient = useQueryClient();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];

  const { data: docs, isLoading: docsLoading } = useQuery<Doc[]>({
    queryKey: ['docs', activeWorkspace?.id],
    queryFn: () => getWorkspaceDocs(activeWorkspace!.id),
    enabled: !!activeWorkspace?.id,
  });

  const createDocMutation = useMutation({
    mutationFn: (data: { title: string; parentDocId?: string }) =>
      createDoc(activeWorkspace!.id, data),
    onSuccess: () => {
      toast.success('Đã tạo tài liệu mới');
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi tạo tài liệu');
    },
  });

  const handleCreateRootDoc = () => {
    if (activeWorkspace) {
      createDocMutation.mutate({ title: 'Tài liệu không tên' });
    }
  };

  if (workspacesLoading || docsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <SectionSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-sm">
      {/* Secondary Sidebar: Doc Tree */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-surface-border bg-slate-50/50">
        <div className="flex h-14 items-center justify-between px-4 border-b border-surface-border bg-white/50">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tài liệu</h2>
          <button
            onClick={handleCreateRootDoc}
            disabled={createDocMutation.isPending}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors"
          >
            <Plus size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Quick Find */}
          <div className="px-3 mb-4 mt-2">
            <button className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md bg-white border border-slate-200 text-[12px] text-slate-500 hover:bg-slate-50 transition-colors">
              <Search size={12} />
              <span>Tìm nhanh...</span>
            </button>
          </div>

          <nav className="px-2 space-y-0.5">
            <DocTreeItem
              nodes={docs || []}
              activeId={params.docId as string}
              onCreateSubDoc={(parentDocId) =>
                createDocMutation.mutate({ title: 'Tài liệu con mới', parentDocId })
              }
            />
          </nav>

          <div className="mt-8 px-4 py-2 space-y-1">
            <button className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-slate-500 hover:bg-slate-200/50 transition-colors">
              <Clock size={14} />
              <span>Gần đây</span>
            </button>
            <button className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-slate-500 hover:bg-slate-200/50 transition-colors">
              <Star size={14} />
              <span>Yêu thích</span>
            </button>
            <button className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-slate-500 hover:bg-slate-200/50 transition-colors">
              <Trash2 size={14} />
              <span>Thùng rác</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Doc Area */}
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  );
}

function DocTreeItem({
  nodes,
  activeId,
  depth = 0,
  onCreateSubDoc,
}: {
  nodes: Doc[];
  activeId: string;
  depth?: number;
  onCreateSubDoc: (parentDocId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (nodes.length === 0 && depth === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-[12px] text-slate-400 italic">Chưa có tài liệu nào</p>
      </div>
    );
  }

  return (
    <>
      {nodes.map((doc) => {
        const hasChildren = doc.children && doc.children.length > 0;
        const isExpanded = expanded[doc.id];
        const isActive = activeId === doc.id;

        return (
          <div key={doc.id}>
            <div
              className={`flex items-center group rounded-md transition-colors ${
                isActive ? 'bg-slate-200' : 'hover:bg-slate-200/50'
              }`}
            >
              <button
                onClick={(e) => toggleExpand(doc.id, e)}
                className={`p-1 text-slate-400 hover:text-slate-600 ${!hasChildren && 'invisible'}`}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              <Link
                href={`/docs/${doc.id}`}
                className="flex-1 flex items-center gap-2 py-1.5 pr-2 min-w-0"
              >
                <FileText size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                <span
                  className={`truncate text-[13px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}
                >
                  {doc.title || 'Không tiêu đề'}
                </span>
              </Link>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCreateSubDoc(doc.id);
                }}
                className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <Plus size={12} />
              </button>
            </div>

            {isExpanded && hasChildren && (
              <div className="ml-4 border-l border-slate-200">
                <DocTreeItem
                  nodes={doc.children!}
                  activeId={activeId}
                  depth={depth + 1}
                  onCreateSubDoc={onCreateSubDoc}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
