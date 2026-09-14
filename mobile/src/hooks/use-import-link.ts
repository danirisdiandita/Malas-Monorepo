import { useMutation } from '@tanstack/react-query';

import { importLink, importPhoto, importText } from '@/lib/api';

export function useImportLink() {
  return useMutation({ mutationFn: (input: string | { url: string; preferences?: { language_code?: string; folder_id?: string } }) => typeof input === 'string' ? importLink(input) : importLink(input.url, input.preferences) });
}

export function useImportPhoto() {
  return useMutation({ mutationFn: ({ uri, preferences }: { uri: string; preferences?: { language_code?: string; folder_id?: string } }) => importPhoto(uri, preferences) });
}

export function useImportText() {
  return useMutation({ mutationFn: ({ text, preferences }: { text: string; preferences?: { language_code?: string; folder_id?: string } }) => importText(text, preferences) });
}
