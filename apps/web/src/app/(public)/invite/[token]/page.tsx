'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, Loader2, ArrowRight, LogIn } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/hooks';
import { toast } from 'sonner';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { status } = useAuthSession();
  const [invitation, setInvitation] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const data = (await apiGet(`/workspaces/invitations/${params.token}`)) as Record<
          string,
          string
        >;
        setInvitation(data);
      } catch (err) {
        setError((err as Error).message || 'Lời mời không hợp lệ hoặc đã hết hạn.');
      } finally {
        setLoading(false);
      }
    }
    fetchInvitation();
  }, [params.token]);

  const handleJoin = async () => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?redirect=/invite/${params.token}`);
      return;
    }

    setIsJoining(true);
    try {
      await apiPost(`/workspaces/invitations/${params.token}/accept`, {}, { auth: true });
      toast.success('Chào mừng! Bạn đã tham gia Workspace thành công.');
      router.push('/dashboard');
    } catch (err) {
      toast.error((err as Error).message || 'Không thể tham gia Workspace lúc này.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full premium-card p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rất tiếc!</h1>
          <p className="text-slate-500 font-medium">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-600 to-transparent opacity-10" />
      <div className="absolute -right-40 -top-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />

      <main className="max-w-lg w-full relative z-10 transition-all">
        <div className="premium-card p-12 text-center shadow-2xl space-y-8">
          <div className="w-24 h-24 bg-brand-600 text-white rounded-[2.5rem] shadow-xl shadow-brand-600/30 flex items-center justify-center mx-auto transform transition hover:scale-110">
            <Sparkles size={48} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Lời mời tham gia
            </h1>
            <p className="text-lg text-slate-500 font-medium">
              <span className="text-slate-900 font-black">{invitation?.inviterName}</span> mời bạn
              gia nhập công ty
              <span className="text-brand-600 font-black"> {invitation?.workspaceName}</span>
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl border border-slate-100">
              🏢
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Workspace
              </p>
              <h3 className="font-bold text-slate-900">{invitation?.workspaceName}</h3>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full px-8 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-2xl shadow-slate-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-tight group"
            >
              {isJoining ? (
                <Loader2 className="animate-spin" size={20} />
              ) : status === 'unauthenticated' ? (
                <>
                  <LogIn size={20} />
                  <span>Đăng nhập để tham gia</span>
                </>
              ) : (
                <>
                  <span>Gia nhập ngay bây giờ</span>
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Xác nhận bạn chấp nhận các điều khoản của SuperBoard
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
