import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getImportStatus, retryImport } from '@/lib/api';

export function useImportStatus(runID: string) {
  return useQuery({
    queryKey: ['imports', runID],
    queryFn: () => getImportStatus(runID),
    enabled: Boolean(runID),
    refetchInterval: (query) => ['done','failed'].includes(query.state.data?.status ?? '') ? false : 5000,
  });
}

export function useRetryImport(runID: string) {
 const client = useQueryClient();
 return useMutation({ mutationFn: () => retryImport(runID),
  onSuccess: () => client.invalidateQueries({queryKey:['imports',runID]}) });
}
