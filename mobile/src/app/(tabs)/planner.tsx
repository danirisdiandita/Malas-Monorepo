import { Ionicons } from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const colors = { ink: '#14231A', leaf: '#4E8B5B', sage: '#DDE8D6', muted: '#738078', line: '#D9E1D7', tomato: '#E87955' };
const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getCurrentWeek() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay() || 7;
  monday.setDate(today.getDate() - day + 1);
  return dayNames.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { name, date: String(date.getDate()), selected: index === day - 1 };
  });
}

export default function PlannerScreen() {
  const days = getCurrentWeek();
  return <ThemedView style={styles.screen}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content}>
    <ThemedText style={styles.eyebrow}>YOUR WEEK</ThemedText><ThemedText style={styles.title}>Daily planner</ThemedText>
    <View style={styles.days}>{days.map(({ name, date, selected }) => <View key={name} style={[styles.day, selected && styles.selectedDay]}><ThemedText style={[styles.dayName, selected && styles.selectedText]}>{name}</ThemedText><ThemedText style={[styles.date, selected && styles.selectedText]}>{date}</ThemedText></View>)}</View>
    <View style={styles.summary}><Ionicons name="restaurant-outline" size={18} color={colors.leaf} /><View><ThemedText style={styles.summaryTitle}>Wednesday dinner</ThemedText><ThemedText style={styles.summaryMeta}>1 recipe · 25 min · 4 ingredients</ThemedText></View></View>
    <ThemedText style={styles.today}>TODAY</ThemedText>
    {[['BREAKFAST', 'Greek yogurt bowl', '20 min', 'cafe-outline'], ['LUNCH', 'Green goddess bowl', 'Fresh · 25 min', 'leaf-outline'], ['DINNER', 'Miso butter salmon', 'Tonight · 30 min', 'fish-outline']].map(([meal, name, meta, icon]) => <View key={meal} style={styles.mealRow}><ThemedText style={styles.mealLabel}>{meal}</ThemedText><View style={styles.mealCard}><View style={styles.mealIcon}><Ionicons name={icon as never} size={20} color={colors.leaf} /></View><View><ThemedText style={styles.mealName}>{name}</ThemedText><ThemedText style={styles.mealMeta}>{meta}</ThemedText></View></View></View>)}
  </ScrollView></SafeAreaView></ThemedView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFBF8' }, safeArea: { flex: 1 }, content: { padding: 20, gap: 14, paddingBottom: 30 }, eyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 }, title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: -8 }, days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }, day: { width: 42, height: 60, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 4 }, selectedDay: { backgroundColor: colors.ink, borderColor: colors.ink }, dayName: { color: colors.muted, fontSize: 11, fontWeight: '800' }, date: { color: colors.ink, fontSize: 16, fontWeight: '800' }, selectedText: { color: '#fff' }, summary: { minHeight: 72, borderRadius: 16, backgroundColor: colors.sage, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, summaryTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, summaryMeta: { color: colors.muted, fontSize: 13, marginTop: 3 }, today: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: 4 }, mealRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, mealLabel: { color: colors.muted, width: 52, fontSize: 11, fontWeight: '900' }, mealCard: { flex: 1, minHeight: 64, borderRadius: 13, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 9 }, mealIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' }, mealMeta: { color: colors.muted, fontSize: 13, marginTop: 3 },
});
