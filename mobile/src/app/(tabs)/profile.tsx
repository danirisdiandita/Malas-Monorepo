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
const profileOptions = [['star-outline', 'Rate & Feedback'], ['help-circle-outline', 'Help & Support'], ['lock-closed-outline', 'Privacy Policy'], ['document-text-outline', 'Terms of Service']];

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const handleSignOut = async () => {
    try { await signOut(); await queryClient.cancelQueries(); queryClient.clear(); router.replace('/sign-in'); } catch { Alert.alert('Sign out failed', 'Please try again.'); }
  };
  const handleDeleteAccount = () => Alert.alert('Delete account?', 'This permanently removes your account and saved recipes.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete account', style: 'destructive', onPress: () => Alert.alert('Not available yet', 'Account deletion will be connected when the API endpoint is ready.') },
  ]);
  return <ThemedView style={styles.screen}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}>
    <Pressable style={styles.header} onPress={() => router.back()}><Ionicons name="chevron-back" size={18} color={colors.muted} /><ThemedText style={styles.title}>Settings</ThemedText><View /></Pressable>
    <ThemedText style={styles.userName}>{user?.name || 'Your profile'}</ThemedText>
    <View style={styles.proCard}><View style={styles.proTop}><ThemedText style={styles.proEyebrow}>YUZU PRO</ThemedText><ThemedText style={styles.proPrice}>from $8 / week</ThemedText></View><ThemedText style={styles.proTitle}>Cook without limits.</ThemedText><ThemedText style={styles.proMeta}>Unlimited imports · smart pantry · meal plans</ThemedText><Pressable style={styles.upgrade} onPress={() => router.push('/paywall')}><ThemedText style={styles.upgradeText}>Upgrade to Pro</ThemedText></Pressable></View>
    <View style={styles.options}>{profileOptions.map(([icon, label]) => <Pressable key={label} style={styles.option} onPress={() => Alert.alert(label, 'This section is ready for local configuration.')}><Ionicons name={icon as never} size={19} color={colors.leaf} /><ThemedText style={styles.optionLabel}>{label}</ThemedText><Ionicons name="chevron-forward" size={15} color={colors.muted} /></Pressable>)}</View>
    <Pressable style={styles.signOut} onPress={handleSignOut}><Ionicons name="log-out-outline" size={19} color="#fff" /><ThemedText style={styles.signOutText}>Sign out</ThemedText></Pressable>
    <ThemedText style={styles.version}>yuzu v1.0.0</ThemedText>
    <View style={styles.dangerDivider} />
    <ThemedText style={styles.dangerSection}>DANGER ZONE</ThemedText><Pressable style={styles.deleteAccount} onPress={handleDeleteAccount}><Ionicons name="trash-outline" size={18} color="#D92D20" /><ThemedText style={styles.deleteAccountText}>DELETE ACCOUNT</ThemedText></Pressable>
  </ScrollView></SafeAreaView></ThemedView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBF8' }, safeArea: { flex: 1 }, content: { padding: 20, gap: 12, paddingBottom: 30 }, header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }, title: { color: colors.ink, fontSize: 22, fontWeight: '800' }, userName: { color: colors.ink, fontSize: 20, fontWeight: '800' }, proCard: { backgroundColor: colors.ink, borderRadius: 17, padding: 16, gap: 6 }, proTop: { flexDirection: 'row', justifyContent: 'space-between' }, proEyebrow: { color: '#F8C957', fontSize: 11, fontWeight: '900', letterSpacing: 1 }, proPrice: { color: '#fff', fontSize: 14 }, proTitle: { color: '#fff', fontSize: 18, fontWeight: '800' }, proMeta: { color: '#B6C2B9', fontSize: 14 }, upgrade: { alignSelf: 'flex-start', backgroundColor: '#F8C957', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, marginTop: 3 }, upgradeText: { color: colors.ink, fontSize: 14, fontWeight: '900' }, options: { backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 12 }, option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line }, optionLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', flex: 1 }, signOut: { minHeight: 50, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, signOutText: { color: '#fff', fontSize: 15, fontWeight: '800' }, version: { color: colors.muted, fontSize: 12 },
  dangerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E4BDBA', marginTop: 8 }, dangerSection: { color: '#D92D20', fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: 1 }, deleteAccount: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: '#FDA29B', backgroundColor: '#FEF3F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, deleteAccountText: { color: '#D92D20', fontSize: 15, fontWeight: '900' },
});
