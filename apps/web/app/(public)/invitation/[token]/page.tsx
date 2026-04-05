'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/auth';
import { useInvitationByToken, useAcceptInvitation } from '@/hooks/workspace';
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
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
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể chấp nhận lời mời';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10 bg-linear-to-br from-brand-50 via-white to-brand-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-4xl shadow-inner animate-bounce duration-1000">
            ✉️
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-extrabold text-slate-900 tracking-tight italic">
          Chào mừng bạn!
        </h1>

        <div className="mb-10 text-slate-600 leading-relaxed">
          <p className="mb-2">
            <span className="font-bold text-slate-900">{invitation.inviterName}</span> đã mời bạn
            gia nhập đội ngũ tại:
          </p>
          <div className="inline-block px-4 py-2 rounded-xl bg-linear-to-r from-brand-600 to-purple-600 text-white font-bold text-xl shadow-lg transform -rotate-1">
            "{invitation.workspaceName}"
          </div>
        </div>

        {isEmailMismatch && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-left text-sm text-amber-900 shadow-sm">
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
              className="mt-4 text-xs font-bold text-brand-600 hover:underline"
            >
              Đăng nhập bằng tài khoản khác →
            </button>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleAccept}
            disabled={isProcessing || !!isEmailMismatch}
            className="group relative w-full overflow-hidden rounded-xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {isProcessing
                ? 'Đang kết nối...'
                : user
                  ? 'CHẤP NHẬN THAM GIA'
                  : 'Đăng nhập để bắt đầu'}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-brand-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Để sau, tôi chưa sẵn sàng
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-6 w-6 rounded bg-brand-600 flex items-center justify-center text-[10px] text-white font-black italic">
              SB
            </span>
            <span className="text-xs font-black text-slate-400 tracking-widest uppercase">
              SuperBoard
            </span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium tracking-widest">
            THE PLATFORM FOR HIGH-PERFORMANCE TEAMS
          </p>
        </div>
      </div>
    </div>
  );
}
