import { Ionicons } from '@react-native-vector-icons/ionicons';
import BottomSheet, { BottomSheetView, type BottomSheetMethods } from '@expo/ui/community/bottom-sheet';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const colors = { ink: '#14231A', leaf: '#2F6B3E', sage: '#DDE8D6', muted: '#738078', line: '#D9E1D7', tomato: '#E87955', sun: '#F8C957' };
const options = [['search-outline', 'Search by ingredients'], ['logo-tiktok', 'From social'], ['image-outline', 'Photo · screenshot or saved photo'], ['camera-outline', 'Photo of a dish'], ['sparkles-outline', 'Ask AI for a recipe'], ['document-text-outline', 'Paste a recipe · from text'], ['chatbubble-ellipses-outline', 'Chat with AI']];

export default function AddTabScreen() {
  const sheetRef = useRef<BottomSheetMethods>(null);
  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => sheetRef.current?.present(), 0);
    return () => clearTimeout(timer);
  }, []));
  const chooseOption = () => { sheetRef.current?.close(); router.push('/add-recipe'); };

  return <ThemedView style={styles.screen}><BottomSheet ref={sheetRef} index={-1} snapPoints={['70%']} enablePanDownToClose backgroundStyle={styles.sheet}><BottomSheetView style={styles.sheetContent}><ThemedText style={styles.sheetTitle}>How would you like to add it?</ThemedText><ThemedText style={styles.sheetBody}>Choose a quick way to start your next recipe.</ThemedText>{options.map(([icon, label]) => <Pressable key={label} style={styles.option} onPress={chooseOption}><View style={styles.optionIcon}><Ionicons name={icon as never} size={18} color={colors.leaf} /></View><ThemedText style={styles.optionLabel}>{label}</ThemedText><Ionicons name="chevron-forward" size={16} color={colors.muted} /></Pressable>)}<Pressable style={styles.manual} onPress={chooseOption}><Ionicons name="create-outline" size={17} color={colors.leaf} /><ThemedText style={styles.manualLabel}>Add manually</ThemedText></Pressable></BottomSheetView></BottomSheet></ThemedView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FCFBF8' }, sheet: { backgroundColor: '#FCFBF8', borderTopLeftRadius: 24, borderTopRightRadius: 24 }, sheetContent: { padding: 20, gap: 10 }, sheetTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' }, sheetBody: { color: colors.muted, fontSize: 16, marginBottom: 5 }, option: { minHeight: 52, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10 }, optionIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, optionLabel: { color: colors.ink, fontSize: 16, fontWeight: '700', flex: 1 }, manual: { minHeight: 52, borderRadius: 13, backgroundColor: colors.sage, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 }, manualLabel: { color: colors.leaf, fontSize: 16, fontWeight: '800' } });
