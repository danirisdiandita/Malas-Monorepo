import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useImportStatus, useRetryImport } from '@/hooks/use-import-status';

const colors = { ink: '#294337', leaf: '#58A943', muted: '#789083', sage: '#EAF5DE', line: '#D7EBC4', cream: '#F5F7F1' };

export default function RecipeProcessingScreen() {
  const { runID, url } = useLocalSearchParams<{ runID: string; url: string }>();
  const runId = typeof runID === 'string' ? runID : '';
  const sourceURL = typeof url === 'string' ? url : 'Processing link…';
  const { data, isError } = useImportStatus(runId);
  const retry = useRetryImport(runId);
  const queryClient = useQueryClient();
  const failed = data?.status === 'failed';
  const done = data?.status === 'done';
  const making = data?.status === 'making';

  return <ThemedView style={styles.screen}><SafeAreaView style={{flex:1}}><ScrollView contentContainerStyle={{paddingBottom:24}}>
    <View style={styles.header}><Pressable onPress={() => router.back()} accessibilityLabel="Go back"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable><ThemedText style={styles.headerTitle}>Creating your recipe</ThemedText><ThemedText style={styles.help}>?</ThemedText></View>
    <View style={styles.hero}><ThemedText style={styles.emoji}>🍋</ThemedText></View>
    <ThemedText style={styles.title}>{failed ? 'Recipe needs another try' : done ? 'Your recipe is ready' : 'Your recipe is on its way'}</ThemedText>
    <ThemedText style={styles.description}>{retry.error?.message || (failed ? data.error : isError ? 'We could not check the import yet. Check your connection or sign in again.' : 'We’re turning that TikTok into something delicious and easy to follow.')}</ThemedText>
    <View style={styles.card}><View style={styles.icon}><ThemedText style={styles.music}>♪</ThemedText></View><View style={styles.cardCopy}><ThemedText style={styles.cardTitle}>Recipe link added</ThemedText><ThemedText style={styles.cardUrl} numberOfLines={1}>{sourceURL}</ThemedText></View><ThemedText style={styles.check}>✓</ThemedText></View>
    <View style={styles.steps}><Step done={making || done} active={!making && !done && !failed} title="Looking at your TikTok" subtitle="Finding ingredients and steps" /><Step done={done} active={making} title="Making your recipe" subtitle="Reading your photos and saving the recipe" /><Step done={done} active={false} title="Ready to cook" subtitle="Your recipe and cover are saved" /></View>
    {done ? <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
      void queryClient.invalidateQueries({queryKey:['recipes']});
      router.replace({pathname:'/recipe/[id]',params:{id:data.recipe_id}});
    }}><ThemedText style={styles.buttonLabel}>View recipe</ThemedText></Pressable> :
    failed ? <Pressable accessibilityRole="button" disabled={retry.isPending} style={styles.button} onPress={() => retry.mutate()}><ThemedText style={styles.buttonLabel}>{retry.isPending ? 'Retrying…' : 'Try again'}</ThemedText></Pressable> :
    <ActivityIndicator accessibilityLabel="Creating your recipe" color={colors.leaf} style={styles.spinner} />}
  </ScrollView></SafeAreaView></ThemedView>;
}

function Step({ done, active, title, subtitle }: { done: boolean; active: boolean; title: string; subtitle: string }) {
  return <View style={styles.step}><View style={[styles.dot, done && styles.doneDot, active && styles.activeDot]}>{done ? <ThemedText style={styles.dotCheck}>✓</ThemedText> : active ? <View style={styles.pulse} /> : null}</View><View><ThemedText style={[styles.stepTitle, !done && !active && styles.dim]}>{title}</ThemedText><ThemedText style={styles.stepSubtitle}>{subtitle}</ThemedText></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 24 }, header: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, help: { color: colors.muted, fontSize: 18, fontWeight: '900' }, hero: { width: 150, height: 150, alignSelf: 'center', marginTop: 34, borderRadius: 75, backgroundColor: colors.sage, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 62 }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 30 }, description: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 }, card: { height: 58, marginTop: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5EBDD', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 }, icon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#17221D', alignItems: 'center', justifyContent: 'center' }, music: { color: '#fff', fontSize: 16 }, cardCopy: { flex: 1 }, cardTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' }, cardUrl: { color: '#9AA79F', fontSize: 11, marginTop: 2 }, check: { color: colors.leaf, fontSize: 18, fontWeight: '900' }, steps: { marginTop: 38, gap: 25 }, step: { flexDirection: 'row', alignItems: 'center', gap: 16 }, dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E9EEE7', alignItems: 'center', justifyContent: 'center' }, doneDot: { backgroundColor: colors.leaf }, activeDot: { borderWidth: 3, borderColor: colors.leaf, backgroundColor: '#fff' }, pulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.leaf }, dotCheck: { color: '#fff', fontSize: 12, fontWeight: '900' }, stepTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' }, dim: { color: '#809087' }, stepSubtitle: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 }, spinner: { marginTop: 42 }, button: { height: 52, marginTop: 42, borderRadius: 17, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, buttonLabel: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
