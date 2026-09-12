import { useMutation } from '@tanstack/react-query';

import { importLink } from '@/lib/api';

export function useImportLink() {
  return useMutation({ mutationFn: importLink });
}
