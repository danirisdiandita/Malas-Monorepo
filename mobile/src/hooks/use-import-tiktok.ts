import { useMutation } from '@tanstack/react-query';

import { importTikTok } from '@/lib/api';

export function useImportTikTok() {
  return useMutation({ mutationFn: importTikTok });
}
