import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { signOut } from '@/lib/api';

export default function ProfileScreen() {
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      await signOut();
      await queryClient.cancelQueries();
      queryClient.clear();
      queryClient.setQueryData(['auth', 'user'], null);
      router.replace('/sign-in');
    } catch {
      Alert.alert('Sign out failed', 'Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Profile</ThemedText>
      <Pressable style={styles.button} onPress={handleSignOut}>
        <ThemedText style={styles.buttonText}>Sign out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  button: { minWidth: 180, minHeight: 52, borderRadius: 14, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
