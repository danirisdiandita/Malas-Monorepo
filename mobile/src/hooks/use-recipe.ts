import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addRecipeIngredients, deleteRecipe, getRecipe, moveRecipeToFolder, rateRecipe } from '@/lib/api';

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

export function useMoveRecipeToFolder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderID: string | null) => moveRecipeToFolder(id, folderID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useDeleteRecipe(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deleteGroceries: boolean) => deleteRecipe(id, deleteGroceries),
    onSuccess: (_, deleteGroceries) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      if (deleteGroceries) queryClient.invalidateQueries({ queryKey: ['groceries'] });
    },
  });
}

export function useAddRecipeIngredients(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => addRecipeIngredients(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceries'] }),
  });
}
