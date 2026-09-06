import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, signIn, type AuthProvider } from '@/lib/api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: getCurrentUser,
    retry: false,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: AuthProvider) => signIn(provider),
    onSuccess: (user) => queryClient.setQueryData(['auth', 'user'], user),
  });
}
