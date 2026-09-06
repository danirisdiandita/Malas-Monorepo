import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { storeToken } from '@/lib/api';

export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in');
      return;
    }

    storeToken(token).then(() => router.replace('/tab1'));
  }, [token]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>Completing sign in…</ThemedText>
    </ThemedView>
  );
}
