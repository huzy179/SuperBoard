import { ExternalLink, User, Layout } from 'lucide-react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function TaskNodeEmbed(
  props: NodeViewProps | { taskId: string; title: string; status: string; assignee?: string },
) {
  // Support both Tiptap NodeView and direct React component usage
  const isTiptap = 'node' in props;
  const taskId = isTiptap ? props.node.attrs.taskId : props.taskId;
  const title = isTiptap ? props.node.attrs.title : props.title;
  const status = isTiptap ? props.node.attrs.status : props.status;
  const assignee = isTiptap ? props.node.attrs.assignee : props.assignee;

  const statusTone = (() => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('done') || normalized.includes('complete')) {
      return {
        dot: 'bg-emerald-500',
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (normalized.includes('review')) {
      return { dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 border-violet-200' };
    }
    if (normalized.includes('progress') || normalized.includes('doing')) {
      return { dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    return { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 border-amber-200' };
  })();

  const content = (
    <div
      className="my-[var(--space-6)] rounded-lg border border-surface-border bg-surface-card p-[var(--space-5)] shadow-sm transition-colors hover:bg-[color:var(--color-surface-alt)]/45"
      contentEditable={false}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
            <Layout size={18} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[color:var(--color-ink)]">Task</span>
              <span className="rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-muted)]">
                {taskId}
              </span>
            </div>

            <div className="mt-1 truncate text-sm font-semibold text-[color:var(--color-ink)]">
              {title}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[color:var(--color-muted)]">
              <span className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} aria-hidden />
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${statusTone.pill}`}
                >
                  {status}
                </span>
              </span>
              <span className="h-3 w-px bg-surface-border" aria-hidden />
              <span className="inline-flex items-center gap-2">
                <User size={12} className="text-[color:var(--color-faint)]" />
                {assignee || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] transition-colors hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]"
          aria-label="Open task"
        >
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );

  if (isTiptap) {
    return <NodeViewWrapper>{content}</NodeViewWrapper>;
  }

  return content;
}
