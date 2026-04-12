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
import { UsersIcon, MessageSquare, History, Terminal, Send, Clock, Sparkles } from 'lucide-react';

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
      setCreateError(err instanceof Error ? err.message : 'SYNC_TRANSMISSION_ERROR');
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
      setEditError(err instanceof Error ? err.message : 'SYNC_UPDATE_ERROR');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('ARCHIVE_CONFIRMATION: Delete permanent signal?')) return;
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-brand-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            Transmission Logs
          </h3>
        </div>
        {viewerCount > 1 ? (
          <div className="flex items-center gap-3 rounded-full bg-brand-500/10 px-4 py-1.5 border border-brand-500/20 shadow-glow-brand/10">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            <UsersIcon className="h-3 w-3 text-brand-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-400">
              {viewerCount} OPERATORS_SYNCED
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4 px-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded bg-white/5" />
                  <div className="h-3 w-full rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <Terminal size={32} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Recorded Signals</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                className="w-full py-4 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white hover:bg-white/[0.02] transition-all disabled:opacity-30"
              >
                {isFetchingNextPage ? 'FETCHING_MORE_SIGNALS...' : 'RETRIEVE_HISTORICAL_SIGNALS'}
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={handleCreateComment}
          className="relative group p-4 border border-white/5 rounded-[2rem] bg-white/[0.01] focus-within:border-brand-500/30 transition-all"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="ENCIPHER_NEW_SIGNAL..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-white placeholder:text-white/5 resize-none elite-scrollbar"
          />
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-white/10" />
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                REALTIME_ENCRYPTION_ACTIVE
              </span>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || createComment.isPending}
              className="flex items-center gap-3 rounded-xl bg-brand-500/10 border border-brand-500/20 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 hover:bg-brand-500 hover:text-slate-950 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              {createComment.isPending ? 'ENCRYPTING...' : 'TRANSMIT'}
              <Send
                size={14}
                className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
            </button>
          </div>
          {createError && (
            <p className="mt-4 px-2 text-[9px] font-black uppercase tracking-widest text-rose-500/60 animate-pulse">
              {createError}
            </p>
          )}
        </form>
      </div>

      <div className="pt-10 border-t border-white/5 space-y-8">
        <div className="flex items-center gap-3 px-4">
          <History className="h-5 w-5 text-indigo-400" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            Audit Manifest
          </h4>
        </div>
        {isHistoryLoading ? (
          <div className="space-y-4 px-4 opacity-50">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 text-center py-6">
            Audit Empty
          </p>
        ) : (
          <div className="space-y-3 px-2">
            {history.map((event: TaskHistoryItemDTO) => (
              <div
                key={event.id}
                className="group relative flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.01] px-6 py-4 hover:bg-white/[0.02] transition-all"
              >
                <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 group-hover:border-indigo-500/30 transition-all">
                  <Terminal size={12} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/80 line-clamp-1">
                    {describeTaskEvent(event)}
                  </p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-tight text-white/20">
                    OP_STAMP: {formatRelativeTime(event.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function describeTaskEvent(event: TaskHistoryItemDTO) {
  const actor = event.actorName ?? 'SYSTEM_KERNEL';

  if (event.type === 'created') {
    return `${actor.toUpperCase()} INITIALIZED_PROTOCOL`;
  }

  if (event.type === 'status_changed') {
    const from = typeof event.payload?.from === 'string' ? event.payload.from : null;
    const to = typeof event.payload?.to === 'string' ? event.payload.to : null;
    if (from && to) {
      return `${actor.toUpperCase()} RE-ROUTED STATE: ${from.toUpperCase()} → ${to.toUpperCase()}`;
    }
    return `${actor.toUpperCase()} RE-SYNCED STATE`;
  }

  if (event.type === 'assignee_changed') {
    return `${actor.toUpperCase()} REDESIGNATED_OPERATOR`;
  }

  if (event.type === 'comment_added') {
    return `${actor.toUpperCase()} DISPATCHED_SIGNAL`;
  }

  const action = typeof event.payload?.action === 'string' ? event.payload.action : null;
  if (action === 'task_deleted' || action === 'bulk_delete') {
    return `${actor.toUpperCase()} ARCHIVED_UNIT`;
  }
  if (action === 'comment_updated') {
    return `${actor.toUpperCase()} RE-ENCRYPTED_SIGNAL`;
  }
  if (action === 'comment_deleted') {
    return `${actor.toUpperCase()} PURGED_SIGNAL`;
  }

  return `${actor.toUpperCase()} TRIGGERED_SPEC_SYNC`;
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
      <div className="mt-3 text-sm font-bold text-white/90 whitespace-pre-wrap leading-relaxed tracking-tight italic">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span
                key={i}
                className="font-black text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20"
              >
                {part.toUpperCase()}
              </span>
            );
          }
          return part;
        })}
      </div>
    );
  };

  return (
    <div
      className={`group relative rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl transition-all hover:bg-white/[0.04] ${isOwn ? 'border-l-brand-500/30' : ''}`}
    >
      {/* Rim light effect for own comments */}
      {isOwn && (
        <div className="absolute inset-y-8 left-0 w-[2px] bg-gradient-to-b from-transparent via-brand-500/40 to-transparent" />
      )}

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editContent}
            onChange={(e) => onEditContent(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-500/40 transition-all resize-none"
          />
          {editError ? (
            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/60 animate-pulse">
              {editError}
            </p>
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onSaveEdit(comment.id)}
              disabled={isUpdatePending || !editContent.trim()}
              className="rounded-xl bg-brand-500 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
            >
              {isUpdatePending ? 'SYNCING...' : 'RE-SYNC'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl border border-white/5 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              ABORT
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-brand-400">
                {isOwn ? 'OP' : comment.authorName?.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-white">
                  {isOwn ? 'CURRENT_OPERATOR' : comment.authorName?.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <Clock size={10} className="text-white/10" />
                  <span className="text-[9px] font-black uppercase tracking-tight text-white/20">
                    {formatRelativeTime(comment.createdAt).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            {isOwn ? (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onStartEdit(comment)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                >
                  <Sparkles size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeletePending}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 size={14} />
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
