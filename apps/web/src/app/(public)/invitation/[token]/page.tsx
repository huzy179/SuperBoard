'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/system/auth/hooks';
import { useInvitationByToken, useAcceptInvitation } from '@/features/system/workspace/hooks';
import { FullPageLoader, FullPageError } from '@/components/ui/page-states';
import { useState } from 'react';

export default function InvitationPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuthSession();
  const { data: invitation, isLoading: isInvLoading, isError, error } = useInvitationByToken(token);
  const acceptInvitation = useAcceptInvitation();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isAuthLoading || isInvLoading) {
    return <FullPageLoader label="Đang kiểm tra lời mời..." />;
  }

  if (isError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bg p-4">
        <FullPageError
          title="Lời mời không hợp lệ"
          message={
            error instanceof Error
              ? error.message
              : 'Lời mời có thể đã hết hạn hoặc đã được sử dụng.'
          }
          actionLabel="Quay về trang chủ"
          onAction={() => router.push('/')}
        />
      </div>
    );
  }

  const isEmailMismatch = user && user.email.toLowerCase() !== invitation.email.toLowerCase();

  const handleAccept = async () => {
    if (!user) {
      router.push(`/login?redirect=/invitation/${token}`);
      return;
    }

    if (isEmailMismatch) {
      alert('Email đăng nhập không khớp với email được mời.');
      return;
    }

    setIsProcessing(true);
    try {
      await acceptInvitation.mutateAsync(token);
      router.push('/jira');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể chấp nhận lời mời';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 bg-surface-bg">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-card p-8 shadow-luxe text-center">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-xl">
            ✉️
          </div>
        </div>

        <h1 className="mb-2 text-xl font-semibold text-[color:var(--color-ink)]">
          Lời mời tham gia workspace
        </h1>

        <div className="mb-8 text-sm text-[color:var(--color-muted)] leading-relaxed">
          <span className="font-semibold text-[color:var(--color-ink)]">
            {invitation.inviterName}
          </span>{' '}
          mời bạn tham gia{' '}
          <span className="font-semibold text-[color:var(--color-ink)]">
            {invitation.workspaceName}
          </span>
          .
        </div>

        {isEmailMismatch && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-left text-sm text-amber-900">
            <div className="flex items-center gap-2 font-bold mb-2 text-amber-700">
              <span className="text-lg">⚠️</span>
              <p>Email không trùng khớp!</p>
            </div>
            <p className="leading-normal">
              Lời mời này dành cho tài khoản <b>{invitation.email}</b>. Bạn hiện đang đăng nhập với{' '}
              <b>{user.email}</b>.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 text-xs font-semibold text-brand-700 hover:underline"
            >
              Đăng nhập bằng tài khoản khác →
            </button>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleAccept}
            disabled={isProcessing || !!isEmailMismatch}
            className="w-full btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xử lý…
              </span>
            ) : user ? (
              'Chấp nhận tham gia'
            ) : (
              'Đăng nhập để bắt đầu'
            )}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-2 text-sm font-medium text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
          >
            Để sau, tôi chưa sẵn sàng
          </button>
        </div>
      </div>
    </div>
  );
}
