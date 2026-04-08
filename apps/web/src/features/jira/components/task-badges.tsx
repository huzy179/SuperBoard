import type { LabelDTO, TaskTypeDTO } from '@superboard/shared';
import {
  TASK_TYPE_ICONS,
  PRIORITY_STYLES,
  PRIORITY_LABELS,
  type TaskPriority,
} from '@/lib/constants/task';
import { getInitials } from '@/lib/helpers';

export function TaskTypeIcon({ type }: { type: TaskTypeDTO }) {
  const config = TASK_TYPE_ICONS[type] ?? TASK_TYPE_ICONS.task;
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] ${config.color}`}
    >
      {config.icon}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function StoryPointsBadge({ points }: { points: number }) {
  return (
    <span className="tabular-nums inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
      {points}
    </span>
  );
}
export function AssigneeAvatar({
  name,
  color,
  src,
  size = 'md',
}: {
  name: string;
  color?: string | null | undefined;
  src?: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const initials = getInitials(name);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const fullSrc = src ? (src.startsWith('http') ? src : `${baseUrl}${src}`) : null;

  const sizeClasses = {
    xs: 'h-4 w-4 text-[8px]',
    sm: 'h-5 w-5 text-[9px]',
    md: 'h-6 w-6 text-[10px]',
    lg: 'h-8 w-8 text-[12px]',
    xl: 'h-24 w-24 text-[24px]',
  };

  const currentSize = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white shadow-sm overflow-hidden shrink-0 ${currentSize}`}
      style={{ backgroundColor: !fullSrc ? color || '#64748b' : 'transparent' }}
      title={name}
    >
      {fullSrc ? <img src={fullSrc} alt={name} className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

export function LabelDots({ labels }: { labels: LabelDTO[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
          title={label.name}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
          {label.name}
        </span>
      ))}
    </div>
  );
}

export function TaskIdBadge({
  projectKey,
  number,
}: {
  projectKey?: string | null | undefined;
  number?: number | null | undefined;
}) {
  if (!projectKey || !number) return null;
  return (
    <span className="font-mono text-[11px] text-slate-400">
      {projectKey}-{number}
    </span>
  );
}
