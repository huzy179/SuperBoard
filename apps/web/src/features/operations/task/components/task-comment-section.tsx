'use client';

import type { CommentItemDTO, TaskHistoryItemDTO } from '@superboard/shared';
import { type FormEvent, useEffect, useState } from 'react';
import {
  Clock,
  History,
  MessageSquare,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import {
  useCreateComment,
  useDeleteComment,
  useTaskComments,
  useTaskHistory,
  useUpdateComment,
} from '@/features/operations/task/hooks';
import { formatRelativeTime } from '@/lib/format-date';
import { subscribeTaskPresence } from '@/lib/realtime/project-socket';
import { AppButton } from '@/components/ui/app-button';

export function TaskCommentSection({
  projectId,
  taskId,
  currentUserId,
}: {
  projectId: string;
  taskId: string;
  currentUserId: string;
}) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTaskComments(
    projectId,
    taskId,
  );
  const { data: history, isLoading: isHistoryLoading } = useTaskHistory(projectId, taskId);

  const comments =
    data?.pages.flatMap((page: CommentItemDTO[], index: number, allPages: CommentItemDTO[][]) => {
      if (index < allPages.length - 1 || hasNextPage) return page.slice(0, -1);
      return page;
    }) ?? [];

  const createComment = useCreateComment(projectId, taskId);
  const updateComment = useUpdateComment(projectId, taskId);
  const deleteComment = useDeleteComment(projectId, taskId);

  const [newComment, setNewComment] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!projectId || !taskId) return;
    return subscribeTaskPresence(projectId, taskId, (payload) =>
      setViewerCount(payload.viewerCount),
    );
  }, [projectId, taskId]);

  async function handleCreateComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setCreateError(null);
    try {
      await createComment.mutateAsync(trimmed);
      setNewComment('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Không thể gửi bình luận');
    }
  }

  function startEditComment(comment: CommentItemDTO) {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setEditError(null);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditContent('');
    setEditError(null);
  }

  async function handleSaveEditComment(commentId: string) {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setEditError(null);
    try {
      await updateComment.mutateAsync({ commentId, content: trimmed });
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Không thể cập nhật bình luận');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Xoá bình luận này?')) return;
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-500/15 flex items-center justify-center text-brand-500">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Comments</h3>
            <p className="text-xs text-[color:var(--color-muted)]">Trao đổi nhanh trong task</p>
          </div>
        </div>

        {viewerCount > 1 ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
            <UsersIcon size={14} />
            {viewerCount} viewers
          </div>
        ) : null}
      </header>

      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-luxe"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-black/[0.05]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-black/[0.05]" />
                    <div className="h-3 w-full rounded bg-black/[0.04]" />
                    <div className="h-3 w-[90%] rounded bg-black/[0.04]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-surface-border bg-surface-bg p-10 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-black/[0.03] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)]">
              <Terminal size={18} />
            </div>
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">No comments yet</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              Viết bình luận đầu tiên để bắt đầu trao đổi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                editingCommentId={editingCommentId}
                editContent={editContent}
                editError={editError}
                isUpdatePending={updateComment.isPending}
                isDeletePending={deleteComment.isPending}
                onEditContent={setEditContent}
                onStartEdit={startEditComment}
                onCancelEdit={cancelEditComment}
                onSaveEdit={handleSaveEditComment}
                onDelete={handleDeleteComment}
              />
            ))}

            {hasNextPage ? (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-sm font-semibold text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.02] transition-colors disabled:opacity-40"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            ) : null}
          </div>
        )}

        <form
          onSubmit={handleCreateComment}
          className="rounded-lg border border-surface-border bg-surface-card shadow-luxe p-4"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Viết bình luận…"
            className="form-textarea"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-[color:var(--color-faint)]">
              {createError ? <span className="text-rose-700">{createError}</span> : null}
            </div>
            <AppButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newComment.trim() || createComment.isPending}
              isLoading={Boolean(createComment.isPending)}
              rightIcon={<Send size={14} />}
            >
              Send
            </AppButton>
          </div>
        </form>
      </section>

      <section className="space-y-4 pt-6 border-t border-surface-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-black/[0.03] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)]">
            <History size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">History</h4>
            <p className="text-xs text-[color:var(--color-muted)]">Audit log cho task này</p>
          </div>
        </div>

        {isHistoryLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-black/[0.04]" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="rounded-lg border border-surface-border bg-surface-bg p-6 text-sm text-[color:var(--color-muted)]">
            No history.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface-bg p-4"
              >
                <div className="mt-0.5 h-9 w-9 rounded-lg bg-black/[0.03] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)] shrink-0">
                  <Terminal size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[color:var(--color-ink)]">
                    {describeTaskEvent(event)}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)] flex items-center gap-2">
                    <Clock size={12} />
                    {formatRelativeTime(event.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function describeTaskEvent(event: TaskHistoryItemDTO) {
  const actor = event.actorName ?? 'System';

  if (event.type === 'created') return `${actor} created this task`;

  if (event.type === 'status_changed') {
    const from = typeof event.payload?.from === 'string' ? event.payload.from : null;
    const to = typeof event.payload?.to === 'string' ? event.payload.to : null;
    if (from && to) return `${actor} changed status: ${from} → ${to}`;
    return `${actor} changed status`;
  }

  if (event.type === 'assignee_changed') return `${actor} changed assignee`;
  if (event.type === 'comment_added') return `${actor} added a comment`;

  const action = typeof event.payload?.action === 'string' ? event.payload.action : null;
  if (action === 'task_deleted' || action === 'bulk_delete') return `${actor} deleted tasks`;
  if (action === 'comment_updated') return `${actor} updated a comment`;
  if (action === 'comment_deleted') return `${actor} deleted a comment`;

  return `${actor} updated task`;
}

function CommentItem({
  comment,
  currentUserId,
  editingCommentId,
  editContent,
  editError,
  isUpdatePending,
  isDeletePending,
  onEditContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  comment: CommentItemDTO;
  currentUserId: string;
  editingCommentId: string | null;
  editContent: string;
  editError: string | null;
  isUpdatePending: boolean;
  isDeletePending: boolean;
  onEditContent: (v: string) => void;
  onStartEdit: (c: CommentItemDTO) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isEditing = editingCommentId === comment.id;
  const isOwn = comment.authorId === currentUserId;
  const initials = (comment.authorName ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(\B@\w+)/g);
    return (
      <div className="mt-2 text-sm text-[color:var(--color-ink)] whitespace-pre-wrap leading-relaxed">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span
                key={i}
                className="inline-flex items-center rounded-md border border-brand-500/20 bg-brand-50 px-2 py-0.5 font-semibold text-brand-700"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </div>
    );
  };

  return (
    <div className="group rounded-lg border border-surface-border bg-surface-card shadow-luxe p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`h-9 w-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
              isOwn
                ? 'bg-brand-50 border-brand-500/25 text-brand-700'
                : 'bg-black/[0.03] border-surface-border text-[color:var(--color-muted)]'
            }`}
            title={comment.authorName ?? 'User'}
          >
            {isOwn ? 'Me' : initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                {isOwn ? 'You' : (comment.authorName ?? 'User')}
              </p>
              <span className="text-xs text-[color:var(--color-faint)]">·</span>
              <p className="text-xs text-[color:var(--color-muted)]">
                {formatRelativeTime(comment.createdAt)}
              </p>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContent(e.target.value)}
                  rows={3}
                  className="form-textarea"
                />
                {editError ? <p className="text-xs text-rose-700">{editError}</p> : null}
                <div className="flex items-center gap-2">
                  <AppButton
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isUpdatePending || !editContent.trim()}
                    isLoading={Boolean(isUpdatePending)}
                    onClick={() => onSaveEdit(comment.id)}
                  >
                    Save
                  </AppButton>
                  <AppButton type="button" variant="secondary" size="sm" onClick={onCancelEdit}>
                    Cancel
                  </AppButton>
                </div>
              </div>
            ) : (
              renderContentWithMentions(comment.content)
            )}
          </div>
        </div>

        {isOwn && !isEditing ? (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onStartEdit(comment)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
              title="Edit"
            >
              <Sparkles size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              disabled={isDeletePending}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors disabled:opacity-40"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
