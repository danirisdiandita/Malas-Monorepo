import { useQuery } from '@tanstack/react-query';

import { getRecipe } from '@/lib/api';

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: () => getRecipe(id),
    enabled: id !== '',
  });
}
