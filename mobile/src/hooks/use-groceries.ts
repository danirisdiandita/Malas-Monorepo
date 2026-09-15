import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addGrocery, clearGroceries, getGroceries, parseGroceryPhoto, parseGroceries, updateGroceryChecked } from '@/lib/api';

export function useAddGrocery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addGrocery,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }),
  });
}

export function useGroceries() {
  return useQuery({ queryKey: ['groceries'], queryFn: getGroceries, staleTime: 30_000 });
}

export function useParseGroceries() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: parseGroceries, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }) });
}

export function useParseGroceryPhoto() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: parseGroceryPhoto, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }) });
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
