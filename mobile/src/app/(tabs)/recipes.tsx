import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const colors = { ink: '#14231A', leaf: '#4E8B5B', sage: '#DDE8D6', muted: '#738078', line: '#D9E1D7', yellow: '#F8C957' };

export default function Tab1Screen() {
  return (
    <ThemedView style={styles.screen}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><ThemedText style={styles.greeting}>GOOD MORNING, MAYA</ThemedText><ThemedText style={styles.title}>Your recipes</ThemedText></View><View style={styles.headerActions}><View style={styles.avatar}><ThemedText style={styles.avatarText}>M</ThemedText></View><Ionicons name="settings-outline" size={18} color={colors.ink} /></View></View>
      <View style={styles.search}><Ionicons name="search-outline" size={17} color={colors.muted} /><ThemedText style={styles.searchText}>Search saved recipes</ThemedText></View>
      <View style={styles.banner}><View style={styles.bannerCopy}><ThemedText style={styles.bannerEyebrow}>NEW RECIPE?</ThemedText><ThemedText style={styles.bannerTitle}>Save it in one tap.</ThemedText><ThemedText style={styles.bannerBody}>Paste a TikTok or YouTube link.</ThemedText></View><Ionicons name="link-outline" size={38} color={colors.leaf} /></View>
      <View style={styles.sectionHeader}><ThemedText style={styles.sectionTitle}>Recently saved</ThemedText><ThemedText style={styles.seeAll}>See all</ThemedText></View>
      <View style={styles.cards}><RecipeCard title="Creamy lemon pasta" color="#F8E5A9" icon="nutrition-outline" /><RecipeCard title="Crispy chili eggs" color="#F4D2C5" icon="leaf-outline" /></View>
    </ScrollView></SafeAreaView></ThemedView>
  );
}

function RecipeCard({ title, color, icon }: { title: string; color: string; icon: IoniconsIconName }) {
  return <View style={styles.card}><View style={[styles.cardImage, { backgroundColor: color }]}><Ionicons name={icon} size={38} color={colors.ink} /></View><ThemedText style={styles.cardTitle}>{title}</ThemedText><ThemedText style={styles.cardMeta}>20 min · Easy</ThemedText></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBF8' }, safeArea: { flex: 1 }, content: { padding: 20, gap: 16, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, greeting: { color: colors.leaf, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 3 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  search: { height: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13 }, searchText: { color: colors.muted, fontSize: 16 }, banner: { height: 132, borderRadius: 21, backgroundColor: colors.sage, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, bannerCopy: { gap: 4 }, bannerEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '900', letterSpacing: 1 }, bannerTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' }, bannerBody: { color: colors.muted, fontSize: 14 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800' }, seeAll: { color: colors.leaf, fontSize: 14, fontWeight: '800' }, cards: { flexDirection: 'row', gap: 12 }, card: { flex: 1, minHeight: 190, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }, cardImage: { height: 112, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', paddingHorizontal: 9, marginTop: 8 }, cardMeta: { color: colors.muted, fontSize: 13, paddingHorizontal: 9, marginTop: 3 },
});
