'use client';

import { Suspense, FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/page-states';
import { useRedirectAuthenticated } from '@/features/auth/hooks';
import { setAccessToken } from '@/lib/auth-storage';
import { login } from '@/lib/services/auth-service';
import { AppBrand } from '@/components/layout/app-brand';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const checkingAuth = useRedirectAuthenticated();
  const [email, setEmail] = useState('nguyen.minh.tuan@techviet.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (checkingAuth) {
    return <FullPageLoader label="Đang kiểm tra phiên đăng nhập..." />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = await login({ email, password });
      setAccessToken(payload.accessToken);
      router.push(redirect || '/jira');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Đăng nhập thất bại';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
      <div className="relative group overflow-hidden rounded-md border border-white/10 bg-slate-950/40 p-10 shadow-inner backdrop-blur-3xl">
        {/* Physical noise texture proxy */}
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />

        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-var(--space-8) p-var(--space-4) bg-slate-950 rounded-sm shadow-inner border border-white/10">
            <AppBrand subtitle="Neural_Entry" variant="dark" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white uppercase leading-tight mb-2">
            SuperBoard_Terminal
          </h1>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-10">
            Secure_Access_Gateway_v4.2
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-8 text-left">
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-white/20 uppercase tracking-widest pl-2">
                Identity_Email
              </label>
              <div className="relative group/input">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="relative w-full rounded-sm border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white placeholder:text-white/10 outline-none transition-all focus:bg-white/[0.05] focus:border-brand-500/50 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-white/20 uppercase tracking-widest pl-2">
                Access_Secret
              </label>
              <div className="relative group/input">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="relative w-full rounded-sm border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white placeholder:text-white/10 outline-none transition-all focus:bg-white/[0.05] focus:border-brand-500/50 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-14 rounded-sm bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-brand-50 hover:scale-[1.01] active:scale-95 disabled:bg-slate-800 disabled:text-white/20 overflow-hidden shadow-inner mt-var(--space-4)"
            >
              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <div className="h-3 w-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  'Establish_Connection'
                )}
              </span>
            </button>
          </form>

          {error ? (
            <div className="mt-var(--space-6) flex items-center gap-3 text-rose-400 bg-rose-500/5 border border-rose-500/20 px-5 py-3 rounded-sm animate-in slide-in-from-top-2 duration-300">
              <span className="text-[9px] font-bold uppercase tracking-widest">{error}</span>
            </div>
          ) : null}

          <div className="mt-var(--space-10) pt-var(--space-6) border-t border-white/5 w-full flex flex-col items-center gap-2">
            <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">
              SEED_UPLINK_PROTOCOL
            </span>
            <div className="flex gap-3">
              <div className="px-3 py-1.5 bg-white/[0.01] rounded-xs border border-white/5 text-[9px] font-bold text-white/30">
                nguyen.minh.tuan@techviet.local
              </div>
              <div className="px-3 py-1.5 bg-white/[0.01] rounded-xs border border-white/5 text-[9px] font-bold text-white/30 font-mono">
                Passw0rd!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader label="Đang tải..." />}>
      <LoginContent />
    </Suspense>
  );
}
