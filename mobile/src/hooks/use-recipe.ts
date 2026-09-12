import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRecipe, rateRecipe } from '@/lib/api';

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: () => getRecipe(id),
    enabled: id !== '',
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useRateRecipe(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) => rateRecipe(id, rating),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes', id] }),
  });
}
