import { useQuery } from '@tanstack/react-query';

import { getGroceries } from '@/lib/api';

export function useGroceries() {
  return useQuery({ queryKey: ['groceries'], queryFn: getGroceries, staleTime: 30_000 });
}
