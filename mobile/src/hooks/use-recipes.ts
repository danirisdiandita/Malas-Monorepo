import { useInfiniteQuery } from '@tanstack/react-query';

import { getRecipes } from '@/lib/api';

export function useRecipes(search: string) {
  const result = useInfiniteQuery({
    queryKey: ['recipes', search],
    queryFn: ({ pageParam }) => getRecipes(pageParam, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next_page || undefined,
    staleTime: 30_000,
  });
  return {
    ...result,
    recipes: result.data?.pages.flatMap((page) => page.items) ?? [],
    hasMore: result.hasNextPage,
  };
}
