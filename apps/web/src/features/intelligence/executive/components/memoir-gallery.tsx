'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Book, Copy, History, Mail, Plus, RefreshCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppOverlay } from '@/components/ui/app-overlay';
import {
  generateProjectMemoir,
  getProjectMemoirs,
  type ProjectMemoir,
} from '../api/executive-service';

type Persona = 'executive' | 'technical' | 'celebratory';

const PERSONAS: Array<{ id: Persona; label: string }> = [
  { id: 'executive', label: 'Executive' },
  { id: 'technical', label: 'Technical' },
  { id: 'celebratory', label: 'Celebratory' },
];

export function ProjectMemoirGallery({ projectId }: { projectId: string }) {
  const [memoirs, setMemoirs] = useState<ProjectMemoir[]>([]);
  const [selectedMemoir, setSelectedMemoir] = useState<ProjectMemoir | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePersona, setActivePersona] = useState<Persona>('executive');

  const fetchMemoirs = useCallback(async () => {
    try {
      const data = await getProjectMemoirs(projectId);
      setMemoirs(data);
    } catch {
      toast.error('Không tải được memoir');
    }
  }, [projectId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchMemoirs());
  }, [fetchMemoirs]);

  const generateMemoir = async () => {
    setIsGenerating(true);
    try {
      await generateProjectMemoir(projectId, activePersona);
      toast.success('Đã tạo memoir thành công');
      await fetchMemoirs();
    } catch {
      toast.error('Tạo memoir thất bại');
    } finally {
      setIsGenerating(false);
    }
  };

  const sortedMemoirs = useMemo(() => {
    return [...memoirs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [memoirs]);

  return (
    <>
      <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-luxe">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
              <Book size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--color-ink)] tracking-tight">
                Project memoirs
              </h2>
              <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                Lưu trữ tóm tắt theo nhiều “persona” để truy xuất nhanh.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-black/[0.02] p-1">
              {PERSONAS.map((p) => {
                const active = activePersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePersona(p.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-surface-card border border-surface-border shadow-glass text-[color:var(--color-ink)]'
                        : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={fetchMemoirs}
              className="btn btn-secondary px-3"
              title="Làm mới"
            >
              <RefreshCcw size={16} />
            </button>

            <button
              type="button"
              onClick={generateMemoir}
              disabled={isGenerating}
              className="btn btn-primary"
            >
              {isGenerating ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Tạo memoir
            </button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedMemoirs.map((memoir) => (
            <button
              key={memoir.id}
              type="button"
              onClick={() => setSelectedMemoir(memoir)}
              className="text-left rounded-xl border border-surface-border bg-surface-card hover:bg-black/[0.02] transition-colors p-5 shadow-glass"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {memoir.persona}
                </span>
                <span className="text-xs text-[color:var(--color-faint)]">
                  {new Date(memoir.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-[color:var(--color-ink)] line-clamp-2">
                {memoir.title}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)] line-clamp-3">
                {memoir.content}
              </p>
            </button>
          ))}

          {sortedMemoirs.length === 0 && !isGenerating ? (
            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-surface-border bg-black/[0.02] p-10 text-center">
              <History size={28} className="mx-auto text-[color:var(--color-faint)]" />
              <p className="mt-3 text-sm font-semibold text-[color:var(--color-ink)]">
                Chưa có memoir
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                Bấm “Tạo memoir” để tạo bản ghi đầu tiên.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <AppOverlay
        isOpen={!!selectedMemoir}
        onClose={() => setSelectedMemoir(null)}
        title={selectedMemoir?.title ?? 'Memoir'}
        {...(selectedMemoir
          ? {
              subtitle: `${selectedMemoir.persona} · ${new Date(selectedMemoir.createdAt).toLocaleDateString()}`,
            }
          : {})}
        variant="modal"
        maxWidth="4xl"
        {...(selectedMemoir
          ? {
              footer: (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
                    <Mail size={14} />
                    <span>Chia sẻ qua link (copy thủ công)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selectedMemoir.content);
                          toast.success('Đã copy nội dung');
                        } catch {
                          toast.error('Không thể copy');
                        }
                      }}
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setSelectedMemoir(null)}
                    >
                      <X size={16} />
                      Đóng
                    </button>
                  </div>
                </div>
              ),
            }
          : {})}
      >
        {selectedMemoir ? (
          <article className="prose prose-sm max-w-none text-[color:var(--color-ink)]">
            {selectedMemoir.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>
        ) : null}
      </AppOverlay>
    </>
  );
}
