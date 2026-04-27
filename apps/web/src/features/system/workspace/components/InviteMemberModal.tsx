'use client';

import { useState, useEffect } from 'react';
import { Mail, Shield, User, Copy, Check, X, Loader2, Info } from 'lucide-react';
import { useCreateInvitation } from '@/features/system/workspace/hooks';
import { toast } from 'sonner';

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
}

const ROLES = [
  { id: 'member', label: 'Thành viên', icon: User },
  { id: 'admin', label: 'Quản trị', icon: Shield },
  { id: 'viewer', label: 'Xem', icon: Info },
] as const;

export function InviteMemberModal({ workspaceId, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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
      setError('Vui lòng nhập địa chỉ email người nhận.');
      return;
    }

    try {
      const result = await createInvitation.mutateAsync({ email: trimmedEmail, role });
      setSuccessToken(result.token);
      toast.success('Đã tạo liên kết mời thành công!');
    } catch (err) {
      setError((err as Error).message || 'Có lỗi xảy ra khi tạo lời mời.');
    }
  }

  const [invitationUrl, setInvitationUrl] = useState('');

  useEffect(() => {
    if (successToken && typeof window !== 'undefined') {
      setInvitationUrl(`${window.location.origin}/invite/${successToken}`);
    }
  }, [successToken]);

  function handleCopyLink() {
    void navigator.clipboard.writeText(invitationUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Đã sao chép liên kết!');
  }

  return (
    <div className="modal-overlay p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {successToken ? 'Lời mời đã sẵn sàng' : 'Mời thành viên mới'}
            </h3>
            <p className="modal-subtitle">Cộng tác để hoàn thành dự án nhanh hơn.</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {!successToken ? (
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="form-label">
                  <Mail size={11} />
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dong-doi@cong-ty.com"
                  className="form-input"
                  autoFocus
                />
              </div>

              {/* Role */}
              <div>
                <label className="form-label">
                  <Shield size={11} />
                  Vai trò trong Workspace
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRole(id)}
                      className={`flex flex-col items-center justify-center gap-2 h-20 rounded-sm border transition-all font-bold text-[10px] uppercase tracking-tight ${
                        role === id
                          ? 'border-brand-500/50 bg-brand-500/10 text-brand-400 shadow-inner'
                          : 'border-white/5 bg-white/[0.02] text-white/20 hover:border-white/10 hover:text-white/40'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="form-error animate-in fade-in duration-300">
                  <X size={14} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* Success state */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Check size={20} />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  Uplink_Generated_Successfully
                </h4>
                <p className="text-[11px] text-white/30 font-bold uppercase tracking-wide">
                  Share this secure access node with your peer.
                </p>
              </div>

              {/* Link copy */}
              <div className="relative">
                <input readOnly value={invitationUrl} className="form-input pr-32 text-xs" />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-xs text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                    isCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{isCopied ? 'COPIED' : 'COPY_NODE'}</span>
                </button>
              </div>

              {/* Note */}
              <div className="flex gap-3 rounded-sm bg-amber-500/5 border border-amber-500/20 p-[var(--space-4)] text-[10px] font-bold text-amber-400/80 leading-relaxed uppercase tracking-tight">
                <Info size={12} className="shrink-0 mt-0.5" />
                <p>
                  <b>NOTICE:</b> Mail server integration is currently offline. Manual peer-to-peer
                  transmission required.
                </p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {successToken ? 'Đóng' : 'Để sau'}
            </button>
            {!successToken && (
              <button
                type="submit"
                disabled={createInvitation.isPending}
                className="btn-primary flex-[2]"
              >
                {createInvitation.isPending ? <Loader2 className="btn-spinner" /> : null}
                {createInvitation.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
