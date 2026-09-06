import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedView } from '@/components/themed-view';
import { getCurrentUser, storeToken } from '@/lib/api';

export default function AuthCallbackScreen() {
  const queryClient = useQueryClient();
  const { token } = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in');
      return;
    }

    storeToken(token)
      .then(() => queryClient.fetchQuery({ queryKey: ['auth', 'user'], queryFn: getCurrentUser }))
      .then(() => router.replace('/recipes'))
      .catch(() => router.replace('/sign-in'));
  }, [token, queryClient]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}
