'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCESS_TOKEN_KEY = 'superboard.accessToken';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@acme.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        accessToken?: string;
        message?: string;
      };

      if (!response.ok || !payload.accessToken) {
        throw new Error(payload.message ?? 'Login failed');
      }

      window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
      router.push('/jira');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
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
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <p className="mt-5 text-xs text-slate-500">
          Seed accounts: owner@acme.local / Passw0rd! và member@acme.local / Passw0rd!
        </p>
      </div>
    </main>
  );
}
