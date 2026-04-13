'use client';

import { useSearchParams } from 'next/navigation';
import { SymbiosisConsole } from '@/features/automation/components/SymbiosisConsole';

export default function SymbiosisPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-white/20 font-black uppercase tracking-widest">
        No Active Strategic Workspace Context
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <SymbiosisConsole workspaceId={workspaceId} />
    </div>
  );
}
