import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getRecipes } from '@/lib/api';

export function useRecipes(search: string, folderID = '') {
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const result = useInfiniteQuery({
    queryKey: ['recipes', debouncedSearch, folderID],
    queryFn: ({ pageParam }) => getRecipes(pageParam, debouncedSearch, folderID),
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
