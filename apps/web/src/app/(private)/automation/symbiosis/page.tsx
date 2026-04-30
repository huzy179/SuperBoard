'use client';

import { useSearchParams } from 'next/navigation';
import { SymbiosisConsole } from '@/features/specialized/automation/components/SymbiosisConsole';

export default function SymbiosisPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[color:var(--color-muted)] text-sm font-medium">
        Chưa chọn workspace để hiển thị automation console.
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <SymbiosisConsole workspaceId={workspaceId} />
    </div>
  );
}
