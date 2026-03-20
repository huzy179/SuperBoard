'use client';

import { FormEvent, useState } from 'react';
import type { CommentItemDTO } from '@superboard/shared';
import {
  useTaskComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/use-task-comments';
import { formatRelativeTime } from '@/lib/format-date';

export function TaskCommentSection({
  projectId,
  taskId,
  currentUserId,
}: {
  projectId: string;
  taskId: string;
  currentUserId: string;
}) {
  const { data: comments, isLoading } = useTaskComments(projectId, taskId);
  const createComment = useCreateComment(projectId, taskId);
  const updateComment = useUpdateComment(projectId, taskId);
  const deleteComment = useDeleteComment(projectId, taskId);

  const [newComment, setNewComment] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Bình luận</h3>

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
      ) : !comments || comments.length === 0 ? (
        <p className="mb-4 text-xs text-slate-500">Chưa có bình luận</p>
      ) : (
        <div className="mb-4 space-y-3">
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
    </div>
  );
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
          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
        </>
      )}
    </div>
  );
}
