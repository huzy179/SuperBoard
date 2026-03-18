'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/page-states';
import { useRedirectAuthenticated } from '@/hooks/use-redirect-authenticated';
import { setAccessToken } from '@/lib/auth-storage';
import { login } from '@/lib/services/auth-service';

export default function LoginPage() {
  const router = useRouter();
  const checkingAuth = useRedirectAuthenticated();
  const [email, setEmail] = useState('owner@acme.local');
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
      router.push('/jira');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-7 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SuperBoard Login</h1>
        <p className="mt-2 text-sm text-slate-600">Đăng nhập MVP (seed account đã có sẵn).</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <p className="mt-5 text-xs text-slate-500">
          Seed accounts: owner@acme.local / Passw0rd! và member@acme.local / Passw0rd!
        </p>
      </div>
    </div>
  );
}
