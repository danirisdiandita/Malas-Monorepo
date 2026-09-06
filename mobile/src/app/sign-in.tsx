import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthProviderButton } from '@/components/auth-provider-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SignInScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText themeColor="textSecondary">‹ Back</ThemedText>
        </Pressable>
        <View style={styles.content}>
          <ThemedText type="subtitle" style={styles.title}>Welcome back</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Sign in to continue to your workspace.
          </ThemedText>
          <View style={styles.providers}>
            <AuthProviderButton provider="google" />
            <AuthProviderButton provider="apple" />
          </View>
          <ThemedText themeColor="textSecondary" type="small" style={styles.terms}>
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.two },
  title: { textAlign: 'center' },
  description: { textAlign: 'center', marginBottom: Spacing.three },
  providers: { gap: Spacing.two },
  terms: { textAlign: 'center', marginTop: Spacing.three },
});
