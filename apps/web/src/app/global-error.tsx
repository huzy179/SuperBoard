'use client';

import { FullPageError } from '@/components/ui/page-states';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        <FullPageError
          title="Lỗi hệ thống"
          message={error.message || 'Đã có lỗi nghiêm trọng xảy ra. Vui lòng thử lại.'}
          actionLabel="Tải lại"
          onAction={reset}
        />
      </body>
    </html>
  );
}
