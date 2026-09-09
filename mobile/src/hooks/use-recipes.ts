import { useQuery } from '@tanstack/react-query';

import { getRecipes } from '@/lib/api';

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes,
  });
}
