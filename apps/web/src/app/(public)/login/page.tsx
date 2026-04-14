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
    <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-700">
      <div className="relative group overflow-hidden rounded-[3rem] border border-white/20 bg-white/10 p-12 shadow-glass backdrop-blur-3xl">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 p-4 bg-slate-900 rounded-[2rem] shadow-2xl border border-white/10">
            <AppBrand subtitle="SECURE PORTAL" variant="dark" />
          </div>

          <h1 className="text-4xl font-black tracking-tighter text-luxe-gradient leading-tight mb-2">
            Đăng nhập SuperBoard
          </h1>
          <p className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] mb-10">
            Elite Efficiency Gateway
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-8 text-left">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.25em] pl-4">
                Identity Email
              </label>
              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within/input:opacity-20 transition duration-500" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="relative w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white placeholder:text-white/20 outline-none transition-all focus:bg-white/10 focus:border-brand-500/50 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.25em] pl-4">
                Access Secret
              </label>
              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within/input:opacity-20 transition duration-500" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="relative w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white placeholder:text-white/20 outline-none transition-all focus:bg-white/10 focus:border-brand-500/50 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-16 rounded-2xl bg-white text-slate-900 text-xs font-black uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 disabled:bg-slate-700 disabled:text-white/30 disabled:hover:scale-100 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <div className="h-4 w-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  'ENTER TERMINAL'
                )}
              </span>
            </button>
          </form>

          {error ? (
            <div className="mt-8 flex items-center gap-3 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-6 py-4 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <span className="text-xs font-black uppercase tracking-widest">{error}</span>
            </div>
          ) : null}

          <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-3">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              Seed Access Credentials
            </span>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/60">
                nguyen.minh.tuan@techviet.local
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/60 font-mono">
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
