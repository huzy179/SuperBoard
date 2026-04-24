import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  const authToken = getAccessToken();

  const {
    data: user,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!authToken,
    retry: 1,
  });

  const error = queryError instanceof Error ? queryError.message : null;

  const status = isLoading ? 'loading' : user ? 'authenticated' : 'unauthenticated';

  if (!user && !isLoading && !error && authToken) {
    clearAccessToken();
    router.replace('/login');
  }

  function logout() {
    clearAccessToken();
    router.push('/login');
  }

  return { loading: isLoading, status, error, user: user ?? null, logout };
}
