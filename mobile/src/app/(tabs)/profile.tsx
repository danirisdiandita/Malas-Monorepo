import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCurrentUser } from '@/hooks/use-auth';
import { signOut } from '@/lib/api';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const colors = { ink: '#14231A', leaf: '#4E8B5B', sage: '#DDE8D6', muted: '#738078', line: '#D9E1D7' };

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const handleSignOut = async () => {
    try { await signOut(); await queryClient.cancelQueries(); queryClient.clear(); router.replace('/sign-in'); } catch { Alert.alert('Sign out failed', 'Please try again.'); }
  };
  return <ThemedView style={styles.screen}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}>
    <Pressable style={styles.header} onPress={() => router.back()}><Ionicons name="chevron-back" size={18} color={colors.muted} /><ThemedText style={styles.title}>Settings</ThemedText><View /></Pressable>
    <View style={styles.proCard}><View style={styles.proTop}><ThemedText style={styles.proEyebrow}>YUZU PRO</ThemedText><ThemedText style={styles.proPrice}>from $8 / week</ThemedText></View><ThemedText style={styles.proTitle}>Cook without limits.</ThemedText><ThemedText style={styles.proMeta}>Unlimited imports · smart pantry · meal plans</ThemedText><Pressable style={styles.upgrade} onPress={() => router.push('/paywall')}><ThemedText style={styles.upgradeText}>Upgrade to Pro</ThemedText></Pressable></View>
    <ThemedText style={styles.section}>ACCOUNT</ThemedText><View style={styles.group}><SettingsRow icon="person-outline" label={user?.name || 'Your profile'} /><SettingsRow icon="notifications-outline" label="Notifications" /><SettingsRow icon="sunny-outline" label="Appearance" /></View>
    <ThemedText style={styles.section}>PREFERENCES</ThemedText><View style={styles.group}><SettingsRow icon="leaf-outline" label="Diet preferences" /><SettingsRow icon="basket-outline" label="Pantry items" /></View>
    <Pressable style={styles.signOut} onPress={handleSignOut}><ThemedText style={styles.signOutText}>Sign out</ThemedText></Pressable><ThemedText style={styles.version}>yuzu v1.0.0</ThemedText>
  </ScrollView></SafeAreaView></ThemedView>;
}

function SettingsRow({ icon, label }: { icon: string; label: string }) {
  return <Pressable style={styles.row} onPress={() => Alert.alert(label, 'This setting is ready for local configuration.')}><Ionicons name={icon as never} size={16} color={colors.leaf} /><ThemedText style={styles.rowLabel}>{label}</ThemedText><Ionicons name="chevron-forward" size={14} color={colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBF8' }, safeArea: { flex: 1 }, content: { padding: 20, gap: 12, paddingBottom: 30 }, header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }, title: { color: colors.ink, fontSize: 20, fontWeight: '800' }, proCard: { backgroundColor: colors.ink, borderRadius: 17, padding: 14, gap: 5 }, proTop: { flexDirection: 'row', justifyContent: 'space-between' }, proEyebrow: { color: '#F8C957', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, proPrice: { color: '#fff', fontSize: 8 }, proTitle: { color: '#fff', fontSize: 16, fontWeight: '800' }, proMeta: { color: '#B6C2B9', fontSize: 9 }, upgrade: { alignSelf: 'flex-start', backgroundColor: '#F8C957', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginTop: 3 }, upgradeText: { color: colors.ink, fontSize: 9, fontWeight: '900' }, section: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 5 }, group: { backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 12 }, row: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, rowLabel: { color: colors.ink, fontSize: 11, fontWeight: '700', flex: 1 }, signOut: { minHeight: 48, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, signOutText: { color: '#fff', fontSize: 13, fontWeight: '800' }, version: { color: colors.muted, fontSize: 9 },
});
