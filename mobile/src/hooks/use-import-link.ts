import { useMutation } from '@tanstack/react-query';

import { importLink, importPhoto, importText } from '@/lib/api';

export function useImportLink() {
  return useMutation({ mutationFn: importLink });
}

export function useImportPhoto() {
  return useMutation({ mutationFn: importPhoto });
}

export function useImportText() {
  return useMutation({ mutationFn: importText });
}
