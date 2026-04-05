'use client';

import { useState } from 'react';
import { useCreateInvitation } from '@/hooks/workspace';

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function InviteMemberModal({ workspaceId, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const createInvitation = useCreateInvitation(workspaceId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (successToken) {
      onClose();
      return;
    }

    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Vui lòng nhập email');
      return;
    }

    try {
      const result = await createInvitation.mutateAsync({ email: trimmedEmail, role });
      setSuccessToken(result.token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi lời mời';
      setError(errorMessage);
    }
  }

  const invitationUrl = successToken ? `${window.location.origin}/invitation/${successToken}` : '';

  function handleCopyLink() {
    void navigator.clipboard.writeText(invitationUrl);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-card shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {successToken ? 'Đã tạo lời mời' : 'Mời thành viên mới'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {!successToken ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Email người nhận
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap.email@vidu.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Vai trò mặc định
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="member">Thành viên (Member)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="viewer">Người xem (Viewer)</option>
                </select>
                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-500">
                  {role === 'admin' ? (
                    <p>
                      ✨ <b>Admin:</b> Có toàn quyền quản lý công việc và các thành viên khác trong
                      workspace.
                    </p>
                  ) : role === 'viewer' ? (
                    <p>
                      👁 <b>Viewer:</b> Chỉ có quyền xem thông tin, không thể thay đổi dữ liệu.
                    </p>
                  ) : (
                    <p>
                      👥 <b>Member:</b> Có quyền tạo, cập nhật công việc và tương tác cơ bản.
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
                  ✓
                </div>
                <p className="text-sm font-medium text-slate-900">Lời mời đã sẵn sàng!</p>
                <p className="mt-1 text-xs text-slate-500">
                  Hãy gửi link bên dưới cho <b>{email}</b>
                </p>
              </div>

              <div className="relative">
                <input
                  readOnly
                  value={invitationUrl}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-20 text-xs text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="absolute right-1 top-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-600 shadow-xs border border-slate-200 hover:bg-brand-50 active:scale-95 transition-all"
                >
                  SAO CHÉP
                </button>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-[11px] text-amber-800 leading-relaxed">
                📢 <b>Lưu ý:</b> Vì hệ thống demo chưa tích hợp Mail Server, vui lòng copy link trên
                và gửi trực tiếp cho người nhận.
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {successToken ? 'Đóng' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={createInvitation.isPending}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand-200 hover:bg-brand-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              {createInvitation.isPending
                ? 'Đang tạo...'
                : successToken
                  ? 'Hoàn tất'
                  : 'Tạo lời mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
