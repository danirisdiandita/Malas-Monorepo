import { Ionicons } from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const colors = { ink: '#14231A', leaf: '#4E8B5B', sage: '#DDE8D6', muted: '#738078', line: '#D9E1D7', tomato: '#E87955' };
const groups = [
  { title: 'Produce', count: '3 items', items: [['Avocados', '2 ripe', true], ['Cherry tomatoes', '1 pint', false], ['Basil', '1 bunch', false]] },
  { title: 'Pantry & dairy', count: '2 items', items: [['Parmesan', '200 g', false], ['Olive oil', '1 bottle', false]] },
];

export default function GroceriesScreen() {
  return <ThemedView style={styles.screen}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><ThemedText style={styles.eyebrow}>THIS WEEK</ThemedText><ThemedText style={styles.title}>Grocery list</ThemedText></View><Ionicons name="settings-outline" size={18} color={colors.muted} /></View>
    <View style={styles.progressCard}><View style={styles.progressTop}><ThemedText style={styles.progressLabel}>3 of 12 items</ThemedText><ThemedText style={styles.progressHint}>Almost there</ThemedText></View><View style={styles.track}><View style={styles.progress} /></View></View>
    {groups.map((group) => <View key={group.title} style={styles.group}><View style={styles.groupHeader}><ThemedText style={styles.groupTitle}>{group.title}</ThemedText><ThemedText style={styles.count}>{group.count}</ThemedText></View>{group.items.map(([name, quantity, checked]) => <View key={String(name)} style={styles.item}><View style={[styles.checkbox, checked && styles.checked]}>{checked && <Ionicons name="checkmark" size={12} color="#fff" />}</View><ThemedText style={[styles.itemName, checked && styles.completed]}>{name}</ThemedText><ThemedText style={styles.quantity}>{quantity}</ThemedText></View>)}</View>)}
  </ScrollView></SafeAreaView></ThemedView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBF8' }, safeArea: { flex: 1 }, content: { padding: 20, gap: 18, paddingBottom: 30 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 }, title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 3 }, progressCard: { backgroundColor: colors.sage, borderRadius: 16, padding: 14, gap: 8 }, progressTop: { flexDirection: 'row', justifyContent: 'space-between' }, progressLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' }, progressHint: { color: colors.leaf, fontSize: 13 }, track: { height: 6, borderRadius: 3, backgroundColor: '#FFFFFF99', overflow: 'hidden' }, progress: { width: '25%', height: '100%', borderRadius: 3, backgroundColor: colors.leaf }, group: { gap: 12 }, groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, groupTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, count: { color: colors.muted, fontSize: 13 }, item: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 9 }, checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.leaf, borderColor: colors.leaf }, itemName: { color: colors.ink, fontSize: 16, fontWeight: '700', flex: 1 }, completed: { color: colors.muted, textDecorationLine: 'line-through' }, quantity: { color: colors.muted, fontSize: 14 },
});
