import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearGroceries, getGroceries, updateGroceryChecked } from '@/lib/api';

export function useGroceries() {
  return useQuery({ queryKey: ['groceries'], queryFn: getGroceries, staleTime: 30_000 });
}

export function useClearGroceries() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: clearGroceries, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }) });
}

export function useUpdateGroceryChecked() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => updateGroceryChecked(id, checked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }),
  });
}
