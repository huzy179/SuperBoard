'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCESS_TOKEN_KEY = 'superboard.accessToken';

type MeResponse = {
  user: {
    id: string;
    email: string;
    fullName: string;
    defaultWorkspaceId: string | null;
  };
};

export default function JiraHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse['user'] | null>(null);

  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', []);

  useEffect(() => {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${apiBaseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const payload = (await response.json()) as MeResponse & { message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? 'Unauthorized');
        }

        setMe(payload.user);
      })
      .catch((caughtError) => {
        const message = caughtError instanceof Error ? caughtError.message : 'Unauthorized';
        setError(message);
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBaseUrl, router]);

  function handleLogout() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-600">Loading...</p>
      </main>
    );
  }

  if (error || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Unauthorized</h1>
          <p className="mt-2 text-sm text-rose-600">{error ?? 'No session'}</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Jira MVP Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">Xin chào {me.fullName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 text-sm text-slate-900">{me.email}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</p>
            <p className="mt-1 text-sm text-slate-900">{me.defaultWorkspaceId ?? 'N/A'}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
