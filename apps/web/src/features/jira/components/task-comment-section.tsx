'use client';

import { FormEvent, useState, useEffect } from 'react';
import type { CommentItemDTO, TaskHistoryItemDTO } from '@superboard/shared';
import {
  useTaskComments,
  useTaskHistory,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/features/jira/hooks';
import { formatRelativeTime } from '@/lib/format-date';
import { subscribeTaskPresence } from '@/lib/realtime/project-socket';
import { UsersIcon } from 'lucide-react';

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

  // Flatten pages and handle the cursor item (limit + 1)
  const comments =
    data?.pages.flatMap((page: CommentItemDTO[], index: number, allPages: CommentItemDTO[][]) => {
      // If it's not the last page, or it has a next page, slice the extra item
      if (index < allPages.length - 1 || hasNextPage) {
        return page.slice(0, -1);
      }
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!projectId || !taskId) return;
    return subscribeTaskPresence(projectId, taskId, (payload) => {
      setViewerCount(payload.viewerCount);
    });
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
      setCreateError(err instanceof Error ? err.message : 'Không thể tạo bình luận');
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
    if (!confirm('Bạn có chắc chắn muốn xoá bình luận này?')) return;
    setDeleteError(null);
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Không thể xoá bình luận');
    }
  }

  return (
    <div className="border-t border-surface-border px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Bình luận</h3>
        {viewerCount > 1 ? (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            <UsersIcon className="h-3 w-3" />
            <span>{viewerCount} người đang xem</span>
          </div>
        ) : null}
      </div>

      {deleteError ? (
        <p role="alert" className="mb-2 text-xs text-rose-600">
          {deleteError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="mb-4 text-xs text-slate-500">Chưa có bình luận</p>
      ) : (
        <div className="mb-4 space-y-3">
          {comments.map((comment: CommentItemDTO) => (
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

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Đang tải...' : 'Xem các bình luận cũ hơn'}
            </button>
          )}
        </div>
      )}
      <form onSubmit={handleCreateComment} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          placeholder="Thêm bình luận..."
          aria-label="Bình luận mới"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        {createError ? (
          <p role="alert" className="text-xs text-rose-600">
            {createError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!newComment.trim() || createComment.isPending}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {createComment.isPending ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>

      <div className="mt-6 border-t border-surface-border pt-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Lịch sử task</h4>
        {isHistoryLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-3 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-xs text-slate-500">Chưa có lịch sử thay đổi</p>
        ) : (
          <div className="space-y-2">
            {history.map((event: TaskHistoryItemDTO) => (
              <div
                key={event.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                <p className="text-slate-700">{describeTaskEvent(event)}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {formatRelativeTime(event.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function describeTaskEvent(event: TaskHistoryItemDTO) {
  const actor = event.actorName ?? 'Hệ thống';

  if (event.type === 'created') {
    return `${actor} đã tạo task`;
  }

  if (event.type === 'status_changed') {
    const from = typeof event.payload?.from === 'string' ? event.payload.from : null;
    const to = typeof event.payload?.to === 'string' ? event.payload.to : null;
    if (from && to) {
      return `${actor} đổi trạng thái từ ${from} → ${to}`;
    }
    return `${actor} đã cập nhật trạng thái`;
  }

  if (event.type === 'assignee_changed') {
    return `${actor} đã cập nhật người thực hiện`;
  }

  if (event.type === 'comment_added') {
    return `${actor} đã thêm bình luận`;
  }

  const action = typeof event.payload?.action === 'string' ? event.payload.action : null;
  if (action === 'task_deleted' || action === 'bulk_delete') {
    return `${actor} đã xoá task`;
  }
  if (action === 'comment_updated') {
    return `${actor} đã sửa bình luận`;
  }
  if (action === 'comment_deleted') {
    return `${actor} đã xoá bình luận`;
  }

  return `${actor} đã cập nhật task`;
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

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(\B@\w+)/g);
    return (
      <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span key={i} className="font-bold text-brand-600 bg-brand-50 px-1 rounded">
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => onEditContent(e.target.value)}
            rows={3}
            aria-label="Sửa bình luận"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {editError ? (
            <p role="alert" className="text-xs text-rose-600">
              {editError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSaveEdit(comment.id)}
              disabled={isUpdatePending || !editContent.trim()}
              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isUpdatePending ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                {isOwn ? 'Bạn' : comment.authorName}
              </span>
              <span className="text-[11px] text-slate-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            {isOwn ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onStartEdit(comment)}
                  aria-label={`Sửa bình luận của ${comment.authorName}`}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeletePending}
                  aria-label={`Xoá bình luận của ${comment.authorName}`}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  Xoá
                </button>
              </div>
            ) : null}
          </div>
          {renderContentWithMentions(comment.content)}
        </>
      )}
    </div>
  );
}
