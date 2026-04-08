import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-surface-bg via-white to-surface-bg">
      <div className="flex h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-8 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <span className="text-xl">🔎</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Không tìm thấy trang</h1>
          <p className="mt-2 text-sm text-slate-600">
            Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
