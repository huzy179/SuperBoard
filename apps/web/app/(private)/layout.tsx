'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PrivateRouteGuard } from '@/components/guards/private-route-guard';
import { PrivateShell } from '@/components/layout/private-shell';
import { PRIVATE_NAV_ITEMS } from '@/lib/navigation';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <PrivateRouteGuard>
      {({ user, logout }) => (
        <PrivateShell
          user={user}
          pathname={pathname}
          navItems={PRIVATE_NAV_ITEMS}
          onLogout={logout}
        >
          {children}
        </PrivateShell>
      )}
    </PrivateRouteGuard>
  );
}
