import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { createFolder, deleteFolder, getFolders, updateFolder } from '@/lib/api';

export function useFolders(search = '') {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const result = useInfiniteQuery({
    queryKey: ['folders', debouncedSearch],
    queryFn: ({ pageParam }) => getFolders(pageParam, debouncedSearch),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next_page || undefined,
    staleTime: 30_000,
  });
  return { ...result, folders: result.data?.pages.flatMap((page) => page.items) ?? [] };
}

export function useCreateFolder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => client.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useUpdateFolder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFolder(id, name),
    onSuccess: () => client.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['folders'] });
      client.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
