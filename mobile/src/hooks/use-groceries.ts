import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearGroceries, getGroceries } from '@/lib/api';

export function useGroceries() {
  return useQuery({ queryKey: ['groceries'], queryFn: getGroceries, staleTime: 30_000 });
}

export function useClearGroceries() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: clearGroceries, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }) });
}
