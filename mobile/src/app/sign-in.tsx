import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthProviderButton } from '@/components/auth-provider-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCurrentUser } from '@/hooks/use-auth';

const colors = { ink: '#14231A', leaf: '#2F6B3E', sage: '#DDE8D6', muted: '#738078' };

export default function SignInScreen() {
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (user) router.replace('/recipes');
  }, [user]);

  return (
    <ThemedView style={styles.screen}><SafeAreaView style={styles.safeArea}>
      <Pressable onPress={() => router.replace('/')} hitSlop={12}><ThemedText style={styles.back}>‹ Back to onboarding</ThemedText></Pressable>
      <View style={styles.content}>
        <ThemedText style={styles.brand}>YUZU</ThemedText><ThemedText style={styles.title}>Keep your kitchen in sync.</ThemedText>
        <ThemedText style={styles.description}>Sign in to keep every saved recipe, grocery list, and meal plan safe on every device.</ThemedText>
        <View style={styles.syncCard}><ThemedText style={styles.syncIcon}>ↄ</ThemedText><ThemedText style={styles.syncCaption}>RECIPES · LISTS · PLANS</ThemedText></View>
      </View>
      <View style={styles.authArea}><ThemedText style={styles.continueLabel}>Continue with</ThemedText><View style={styles.providers}><AuthProviderButton provider="google" /><AuthProviderButton provider="apple" /></View></View>
      <View style={styles.footer}><ThemedText style={styles.terms}>By continuing, you agree to our Terms and Privacy Policy.</ThemedText><Pressable onPress={() => router.replace('/recipes')}><ThemedText style={styles.skip}>Not now</ThemedText></Pressable></View>
    </SafeAreaView></ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBF8' }, safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 }, back: { color: colors.muted, fontSize: 16 }, content: { flex: 1, alignItems: 'center', paddingTop: 36 }, brand: { color: colors.leaf, fontSize: 19, fontWeight: '900', letterSpacing: 3, marginBottom: 18 }, title: { color: colors.ink, fontSize: 36, lineHeight: 39, fontWeight: '800', textAlign: 'center', letterSpacing: -0.7 }, description: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', maxWidth: 330, marginTop: 14 }, syncCard: { width: 220, height: 160, borderRadius: 26, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 18 }, syncIcon: { color: colors.leaf, fontSize: 64, lineHeight: 70, fontWeight: '700' }, syncCaption: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, authArea: { width: '100%', paddingTop: 12 }, continueLabel: { color: colors.muted, fontSize: 16, fontWeight: '700', marginBottom: 10, textAlign: 'center' }, providers: { width: '100%', gap: 10 }, footer: { alignItems: 'center', gap: 12, paddingTop: 12 }, terms: { color: colors.muted, fontSize: 12, textAlign: 'center' }, skip: { color: colors.leaf, fontSize: 16, fontWeight: '800' },
});
