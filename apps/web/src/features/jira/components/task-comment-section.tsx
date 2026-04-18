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
import {
  UsersIcon,
  MessageSquare,
  History,
  Terminal,
  Send,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';

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
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <MessageSquare className="h-4 w-4 text-brand-500 animate-pulse" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
            Transmission Logs
          </h3>
        </div>
        {viewerCount > 1 ? (
          <div className="flex items-center gap-4 rounded-2xl bg-brand-500/5 px-6 py-2.5 border border-brand-500/20 shadow-glow-brand/10 backdrop-blur-3xl">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            <UsersIcon className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
              {viewerCount} OPERATORS_SYNCED
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-10">
        {isLoading ? (
          <div className="space-y-6 px-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 shadow-inner" />
                <div className="flex-1 space-y-4">
                  <div className="h-4 w-32 rounded-lg bg-white/5" />
                  <div className="h-4 w-full rounded-lg bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <Terminal size={40} className="mb-6 text-white/10" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              No Recorded Signals
            </p>
            <p className="text-[9px] font-medium uppercase tracking-widest text-white/5 mt-2">
              Awaiting network communication
            </p>
          </div>
        ) : (
          <div className="space-y-6">
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
                className="w-full py-6 rounded-[2rem] border border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-white hover:bg-white/[0.03] hover:border-white/10 transition-all disabled:opacity-30 shadow-inner group"
              >
                {isFetchingNextPage ? (
                  'FETCHING_MORE_SIGNALS...'
                ) : (
                  <span className="flex items-center justify-center gap-4">
                    <Clock size={14} className="group-hover:rotate-12 transition-transform" />
                    RETRIEVE_HISTORICAL_SIGNALS
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={handleCreateComment}
          className="relative group p-8 border border-white/5 rounded-[3rem] bg-white/[0.01] focus-within:border-brand-500/30 transition-all shadow-inner backdrop-blur-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="ENCIPHER_NEW_SIGNAL..."
            className="w-full bg-transparent border-none focus:ring-0 text-base font-bold text-white/[0.8] placeholder:text-white/5 resize-none elite-scrollbar leading-relaxed"
          />
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">
                NEURAL_LINK_SECURE
              </span>
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || createComment.isPending}
              className="flex items-center gap-4 rounded-2xl bg-white text-slate-950 px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-luxe group/btn"
            >
              {createComment.isPending ? 'ENCRYPTING...' : 'TRANSMIT'}
              <Send
                size={16}
                className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
              />
            </button>
          </div>
          {createError && (
            <p className="mt-6 px-2 text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">
              [CRITICAL_FAULT]: {createError}
            </p>
          )}
        </form>
      </div>

      <div className="pt-20 border-t border-white/5 space-y-10">
        <div className="flex items-center gap-4 px-6">
          <History className="h-4 w-4 text-indigo-400" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
            Audit Manifest
          </h4>
        </div>
        {isHistoryLoading ? (
          <div className="space-y-6 px-6 opacity-50">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-6 w-full bg-white/5 rounded-full animate-pulse shadow-inner"
              />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center opacity-10">
            <Clock size={32} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Audit Empty</p>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {history.map((event: TaskHistoryItemDTO) => (
              <div
                key={event.id}
                className="group relative flex items-center gap-6 rounded-[2rem] border border-white/5 bg-white/[0.01] px-8 py-5 hover:bg-white/[0.03] hover:border-white/10 transition-all shadow-inner"
              >
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 group-hover:border-indigo-500/40 transition-all shadow-luxe">
                  <Terminal size={14} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white/70 group-hover:text-white line-clamp-1 truncate uppercase tracking-tight">
                    {describeTaskEvent(event)}
                  </p>
                  <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/10 transition-colors group-hover:text-white/20">
                    OP_STAMP: {formatRelativeTime(event.createdAt).toUpperCase()}
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
      <div className="mt-4 text-base font-bold text-white/80 whitespace-pre-wrap leading-relaxed tracking-tight italic">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span
                key={i}
                className="font-black text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/20 shadow-glow-brand/5"
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
      className={`group relative rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-3xl transition-all hover:bg-white/[0.04] shadow-inner ${isOwn ? 'border-l-brand-500/40 bg-brand-500/[0.01]' : ''}`}
    >
      {/* Rim light effect for own comments */}
      {isOwn && (
        <div className="absolute inset-y-10 left-0 w-[3px] bg-gradient-to-b from-transparent via-brand-500/50 to-transparent shadow-glow-brand/20" />
      )}

      {isEditing ? (
        <div className="space-y-6">
          <textarea
            value={editContent}
            onChange={(e) => onEditContent(e.target.value)}
            rows={3}
            className="w-full rounded-[1.5rem] border border-white/10 bg-slate-950 px-8 py-6 text-sm font-bold text-white focus:outline-none focus:border-brand-500/40 transition-all resize-none shadow-inner"
          />
          {editError ? (
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">
              {editError}
            </p>
          ) : null}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onSaveEdit(comment.id)}
              disabled={isUpdatePending || !editContent.trim()}
              className="rounded-xl bg-brand-500 px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-950 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-luxe"
            >
              {isUpdatePending ? 'SYNCING...' : 'RE-SYNC'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl bg-white/5 border border-white/10 px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              ABORT
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black border transition-all shadow-inner ${isOwn ? 'bg-brand-500 border-brand-500 text-slate-950 rotate-3' : 'bg-slate-900 border-white/5 text-brand-400'}`}
              >
                {isOwn ? 'OP' : comment.authorName?.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1.5">
                <span
                  className={`text-xs font-black uppercase tracking-widest ${isOwn ? 'text-brand-400' : 'text-white/80'}`}
                >
                  {isOwn ? 'CURRENT_OPERATOR' : comment.authorName?.toUpperCase()}
                </span>
                <div className="flex items-center gap-3">
                  <Clock size={12} className="text-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/20">
                    {formatRelativeTime(comment.createdAt).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            {isOwn ? (
              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <button
                  type="button"
                  onClick={() => onStartEdit(comment)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/20 hover:text-brand-400 hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                >
                  <Sparkles size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeletePending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}
          </div>
          <div className="pl-[4.5rem]">{renderContentWithMentions(comment.content)}</div>
        </>
      )}
    </div>
  );
}
