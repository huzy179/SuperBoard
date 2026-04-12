'use client';

import { useState } from 'react';
import { Mail, Shield, User, Copy, Check, X, Loader2, Info } from 'lucide-react';
import { useCreateInvitation } from '@/features/workspace/hooks';
import { toast } from 'sonner';

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
}

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

  const invitationUrl = successToken ? `${window.location.origin}/invite/${successToken}` : '';

  function handleCopyLink() {
    void navigator.clipboard.writeText(invitationUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Đã sao chép liên kết!');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg glass-panel p-1 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-[2.2rem] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {successToken ? 'Lời mời sẵn sàng' : 'Mời đồng đội mới'}
              </h3>
              <p className="text-xs text-slate-500 font-medium tracking-tight">
                Cộng tác cùng nhau để hoàn thành dự án nhanh hơn.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {!successToken ? (
              <div className="space-y-6">
                {/* Email Section */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Mail size={12} />
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dong-doi@cong-ty.com"
                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                    autoFocus
                  />
                </div>

                {/* Role Section */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Shield size={12} />
                    Vai trò trong Workspace
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'member', label: 'Member', icon: <User size={14} /> },
                      { id: 'admin', label: 'Admin', icon: <Shield size={14} /> },
                      { id: 'viewer', label: 'Viewer', icon: <Info size={14} /> },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 transition-all font-bold text-xs ${role === r.id ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                      >
                        {r.icon}
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-600 animate-in shake duration-300">
                    <X size={16} />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Liên kết đã được tạo!
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    Bạn có thể gửi liên kết này trực tiếp cho đồng nghiệp.
                  </p>
                </div>

                <div className="relative group">
                  <input
                    readOnly
                    value={invitationUrl}
                    className="w-full h-14 pl-5 pr-32 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`absolute right-2 top-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-[11px] font-medium text-amber-800 leading-relaxed">
                  <Info size={16} className="shrink-0" />
                  <p>
                    <b>Lưu ý Demo:</b> Hệ thống chưa tích hợp Mail Server tự động. Hãy copy liên kết
                    trên và gửi qua các kênh chat cho đồng nghiệp của bạn.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl text-sm font-black text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all uppercase tracking-tight"
              >
                {successToken ? 'Đóng' : 'Để sau'}
              </button>
              {!successToken && (
                <button
                  type="submit"
                  disabled={createInvitation.isPending}
                  className="flex-[2] h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-tight"
                >
                  {createInvitation.isPending ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Gửi lời mời</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
