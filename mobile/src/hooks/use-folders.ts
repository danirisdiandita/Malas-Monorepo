import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createFolder, deleteFolder, getFolders, updateFolder } from '@/lib/api';

export function useFolders() {
  return useQuery({ queryKey: ['folders'], queryFn: getFolders, staleTime: 30_000 });
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
