import { Alert, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

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
      style={({ pressed }) => [styles.button, provider === 'apple' && styles.appleButton, pressed && styles.pressed, signIn.isPending && styles.disabled]}
      onPress={handlePress}
    >
      <Ionicons name={provider === 'google' ? 'logo-google' : 'logo-apple'} size={20} color={provider === 'google' ? '#4285F4' : '#FFFFFF'} />
      <ThemedText style={[styles.label, provider === 'apple' && styles.appleLabel]}>Continue with {provider === 'google' ? 'Google' : 'Apple'}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9E1D7', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  appleButton: { backgroundColor: '#14231A', borderColor: '#14231A' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  label: { color: '#14231A', fontSize: 14, fontWeight: '800' },
  appleLabel: { color: '#FFFFFF' },
});
