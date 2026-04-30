'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Briefcase,
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import { getKnowledgeDivergence, type StrategicCollision } from '../api/knowledge-service';

export function ConflictResolver() {
  const [collisions, setCollisions] = useState<StrategicCollision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getKnowledgeDivergence()
      .then((data) => {
        setCollisions(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const remaining = useMemo(
    () => collisions.filter((c) => !resolvedIds.has(c.id)),
    [collisions, resolvedIds],
  );

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => new Set([...prev, id]));
  };

  if (isLoading) return <ResolverSkeleton />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--color-ink)]">
              Kiểm tra xung đột
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
              Phát hiện trùng lặp ngữ nghĩa giữa các task/tài liệu để đồng bộ tri thức.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-1.5 text-sm text-[color:var(--color-muted)]">
          <RefreshCcw size={14} className="text-[color:var(--color-faint)]" />
          <span>
            {remaining.length} / {collisions.length} xung đột
          </span>
        </div>
      </header>

      {remaining.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-emerald-900">Đã đồng bộ</h3>
          <p className="mt-1 text-sm text-emerald-800/90">
            Không còn xung đột ngữ nghĩa cần xử lý.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {remaining.map((collision) => (
            <section
              key={collision.id}
              className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800">
                  Mức độ: {(collision.intensity * 100).toFixed(0)}%
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {collision.nodes[0] ? <CollisionNodeCard node={collision.nodes[0]} /> : null}
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)]">
                  <ArrowRightLeft size={18} />
                </div>
                {collision.nodes[1] ? <CollisionNodeCard node={collision.nodes[1]} /> : null}
              </div>

              <div className="mt-5 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/35 p-4">
                <div className="text-xs font-medium text-[color:var(--color-muted)]">
                  Gợi ý xử lý (AI)
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-ink)] leading-relaxed">
                  {collision.protocol}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleResolve(collision.id)}
                  className="btn btn-primary flex-1"
                >
                  <span className="inline-flex items-center gap-2">
                    <LinkIcon size={16} />
                    Liên kết
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(collision.id)}
                  className="btn btn-secondary"
                >
                  Bỏ qua
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CollisionNodeCard({ node }: { node: StrategicCollision['nodes'][number] }) {
  const isTask = node.type === 'task';
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-surface-border bg-surface-bg p-4">
      <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-white text-[color:var(--color-muted)]">
          {isTask ? <Briefcase size={14} /> : <FileText size={14} />}
        </span>
        <span className="truncate">{node.projectName}</span>
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold text-[color:var(--color-ink)] leading-snug">
        {node.title}
      </div>
    </div>
  );
}

function ResolverSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 rounded-lg bg-black/[0.06]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-xl border border-surface-border bg-surface-card" />
        <div className="h-72 rounded-xl border border-surface-border bg-surface-card" />
      </div>
    </div>
  );
}
