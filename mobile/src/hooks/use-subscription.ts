import { useQuery } from '@tanstack/react-query';

import { getSubscriptionStatus } from '@/lib/api';

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscriptionStatus,
    staleTime: 30_000,
    retry: false,
  });
}
