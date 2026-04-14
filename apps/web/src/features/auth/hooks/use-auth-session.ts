import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUserDTO } from '@superboard/shared';
import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';
import { getCurrentUser } from '@/lib/services/auth-service';

type UseAuthSessionResult = {
  loading: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  user: AuthUserDTO | null;
  logout: () => void;
};

export function useAuthSession(): UseAuthSessionResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUserDTO | null>(null);

  const status = loading ? 'loading' : user ? 'authenticated' : 'unauthenticated';

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((caughtError) => {
        const message = caughtError instanceof Error ? caughtError.message : 'Unauthorized';
        setError(message);
        clearAccessToken();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  function logout() {
    clearAccessToken();
    router.push('/login');
  }

  return { loading, status, error, user, logout };
}
