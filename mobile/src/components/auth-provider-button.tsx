import { Alert, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useSignIn } from '@/hooks/use-auth';
import type { AuthProvider } from '@/lib/api';

type AuthProviderButtonProps = { provider: AuthProvider };

export function AuthProviderButton({ provider }: AuthProviderButtonProps) {
  const signIn = useSignIn();

  const handlePress = () => {
    signIn.mutate(provider, {
      onSuccess: () => router.replace('/tab1'),
      onError: (error) => Alert.alert('Sign in failed', error.message),
    });
  };

  return (
    <Pressable
      disabled={signIn.isPending}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, signIn.isPending && styles.disabled]}
      onPress={handlePress}
    >
      <ThemedText style={styles.icon}>{provider === 'google' ? 'G' : ''}</ThemedText>
      <ThemedText style={styles.label}>Continue with {provider === 'google' ? 'Google' : 'Apple'}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: '#8E8E93', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  icon: { fontSize: 20, fontWeight: '700' },
  label: { fontWeight: '600' },
});
