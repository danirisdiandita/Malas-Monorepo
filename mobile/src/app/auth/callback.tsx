import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { storeToken } from '@/lib/api';

export default function AuthCallbackScreen() {
  const queryClient = useQueryClient();
  const { token } = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in');
      return;
    }

    storeToken(token)
      .then(() => queryClient.invalidateQueries({ queryKey: ['auth', 'user'] }))
      .then(() => router.replace('/tab1'))
      .catch(() => router.replace('/sign-in'));
  }, [token, queryClient]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>Completing sign in…</ThemedText>
    </ThemedView>
  );
}
