'use client';

import { type ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceDocs, createDoc } from '@/features/collaboration/docs/api/doc-service';
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
  const [quickQuery, setQuickQuery] = useState('');

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

  const filteredDocs = useMemo(() => {
    const query = quickQuery.trim().toLowerCase();
    const nodes = docs || [];
    if (!query) return nodes;

    const filterTree = (items: Doc[]): Doc[] => {
      const result: Doc[] = [];
      for (const item of items) {
        const title = (item.title || '').toLowerCase();
        const children = item.children ? filterTree(item.children) : [];
        const matches = title.includes(query) || children.length > 0;
        if (matches) result.push({ ...item, children });
      }
      return result;
    };

    return filterTree(nodes);
  }, [docs, quickQuery]);

  if (workspacesLoading || docsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <SectionSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-surface-border bg-surface-bg shadow-sm">
      {/* Secondary Sidebar: Doc Tree */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-surface-border bg-surface-card">
        <div className="flex h-14 items-center justify-between px-4 border-b border-surface-border bg-surface-card">
          <h2 className="text-sm font-semibold text-[color:var(--color-ink)]">Tài liệu</h2>
          <button
            type="button"
            onClick={handleCreateRootDoc}
            disabled={createDocMutation.isPending}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40"
            aria-label="Tạo tài liệu mới"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Quick Find */}
          <div className="px-3 mb-4 mt-2">
            <div className="flex w-full items-center gap-2 px-3 py-2 rounded-md bg-black/[0.02] border border-surface-border text-[12px] text-[color:var(--color-muted)] focus-within:ring-2 focus-within:ring-[color:var(--color-focus)]/35 transition-colors">
              <Search size={12} />
              <input
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Tìm nhanh…"
                className="w-full bg-transparent border-none outline-none text-[12px] text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)]"
              />
            </div>
          </div>

          <nav className="px-2 space-y-0.5">
            <DocTreeItem
              nodes={filteredDocs}
              activeId={params.docId as string}
              onCreateSubDoc={(parentDocId) =>
                createDocMutation.mutate({ title: 'Tài liệu con mới', parentDocId })
              }
            />
          </nav>

          <div className="mt-8 px-4 py-2 space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            >
              <Clock size={14} />
              <span>Gần đây</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            >
              <Star size={14} />
              <span>Yêu thích</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            >
              <Trash2 size={14} />
              <span>Thùng rác</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Doc Area */}
      <main className="flex-1 overflow-y-auto bg-surface-bg">{children}</main>
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
        <p className="text-[12px] text-[color:var(--color-muted)] italic">Chưa có tài liệu nào</p>
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
                isActive
                  ? 'bg-brand-50 border border-brand-500/15'
                  : 'border border-transparent hover:bg-black/[0.03]'
              }`}
            >
              <button
                type="button"
                onClick={(e) => toggleExpand(doc.id, e)}
                className={`p-1 rounded-sm text-[color:var(--color-faint)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35 ${!hasChildren && 'invisible'}`}
                aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              <Link
                href={`/docs/${doc.id}`}
                className="flex-1 flex items-center gap-2 py-1.5 pr-2 min-w-0"
              >
                <FileText
                  size={14}
                  className={isActive ? 'text-brand-600' : 'text-[color:var(--color-faint)]'}
                />
                <span
                  className={`truncate text-[13px] font-medium ${isActive ? 'text-[color:var(--color-ink)]' : 'text-[color:var(--color-muted)]'}`}
                >
                  {doc.title || 'Không tiêu đề'}
                </span>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCreateSubDoc(doc.id);
                }}
                className="p-1 rounded-sm opacity-0 group-hover:opacity-100 text-[color:var(--color-faint)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35"
                aria-label="Tạo tài liệu con"
              >
                <Plus size={12} />
              </button>
            </div>

            {isExpanded && hasChildren && (
              <div className="ml-4 border-l border-surface-border">
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
