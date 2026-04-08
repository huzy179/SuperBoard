'use client';

import { FullPageError } from '@/components/ui/page-states';

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <FullPageError
      title="Đã có lỗi xảy ra"
      message={error.message || 'Không thể tải trang. Vui lòng thử lại.'}
      actionLabel="Thử lại"
      onAction={reset}
    />
  );
}
