'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Loader2, LogIn, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api-client';
import { useAuthSession } from '@/features/system/auth/hooks';

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
      <main className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Đang kiểm tra lời mời…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[color:var(--color-ink)]">Rất tiếc</h1>
          <p className="mt-2 text-sm text-rose-700/90 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 w-full btn btn-primary"
          >
            Quay về trang chủ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[color:var(--color-ink)]">
              Lời mời tham gia workspace
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
              <span className="font-semibold text-[color:var(--color-ink)]">
                {invitation?.inviterName}
              </span>{' '}
              mời bạn tham gia{' '}
              <span className="font-semibold text-[color:var(--color-ink)]">
                {invitation?.workspaceName}
              </span>
              .
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/35 p-4">
          <div className="text-xs font-medium text-[color:var(--color-muted)]">Workspace</div>
          <div className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
            {invitation?.workspaceName}
          </div>
        </div>

        <button
          type="button"
          onClick={handleJoin}
          disabled={isJoining}
          className="mt-6 w-full btn btn-primary"
        >
          {isJoining ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Đang tham gia…
            </span>
          ) : status === 'unauthenticated' ? (
            <span className="inline-flex items-center gap-2">
              <LogIn size={16} />
              Đăng nhập để tham gia
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Tham gia ngay
              <ArrowRight size={16} />
            </span>
          )}
        </button>

        <p className="mt-3 text-xs text-[color:var(--color-muted)] leading-relaxed">
          Khi tham gia, bạn xác nhận bạn được ủy quyền bởi người mời và đồng ý tuân thủ quy định của
          workspace.
        </p>
      </div>
    </main>
  );
}
