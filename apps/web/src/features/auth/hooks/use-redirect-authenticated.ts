import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';
import { getCurrentUser } from '@/lib/services/auth-service';

export function useRedirectAuthenticated(): boolean {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    getCurrentUser()
      .then(() => {
        router.replace('/jira');
      })
      .catch(() => {
        clearAccessToken();
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  return checkingAuth;
}
