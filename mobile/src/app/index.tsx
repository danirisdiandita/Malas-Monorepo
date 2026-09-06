import { useEffect } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/use-auth';

export default function OnboardingScreen() {
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (user) router.replace('/explore');
  }, [user]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <View style={styles.mark}>
            <ThemedText style={styles.markText}>M</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Build less.{"\n"}Ship more.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Your workspace for turning ideas into something real.
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/sign-in')}>
            <ThemedText style={styles.primaryButtonText}>Get started</ThemedText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/sign-in')}>
            <ThemedText>Already have an account?</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.four },
  mark: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  title: { textAlign: 'center' },
  description: { textAlign: 'center', maxWidth: 300 },
  actions: { gap: Spacing.two },
  primaryButton: { minHeight: 56, borderRadius: 16, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
