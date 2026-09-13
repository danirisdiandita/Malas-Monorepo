import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createMealCalendar, getMealCalendar } from '@/lib/api';

export function usePlanner(date: string) {
  return useQuery({ queryKey: ['meal-calendar', date], queryFn: () => getMealCalendar(date), enabled: date !== '', staleTime: 30_000 });
}

export function useCreateMealPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createMealCalendar,
    onSuccess: (_, input) => client.invalidateQueries({ queryKey: ['meal-calendar', input.planned_date] }),
  });
}
