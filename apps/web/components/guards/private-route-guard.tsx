'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUserDTO } from '@superboard/shared';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { useAuthSession } from '@/hooks/use-auth-session';

type GuardRenderProps = {
  user: AuthUserDTO;
  logout: () => void;
};

type PrivateRouteGuardProps = {
  children: (props: GuardRenderProps) => ReactNode;
};

export function PrivateRouteGuard({ children }: PrivateRouteGuardProps) {
  const router = useRouter();
  const { loading, error, user, logout } = useAuthSession();

  if (loading) {
    return <FullPageLoader label="Đang xác thực người dùng..." />;
  }

  if (error || !user) {
    return (
      <FullPageError
        title="Phiên hết hạn"
        message={error ?? 'Vui lòng đăng nhập lại'}
        actionLabel="Quay lại đăng nhập"
        onAction={() => router.push('/login')}
      />
    );
  }

  return <>{children({ user, logout })}</>;
}
