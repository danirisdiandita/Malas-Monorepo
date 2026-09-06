import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export const yuzuColors = { ink: '#14231A', leaf: '#2F6B3E', sage: '#DDE8D6', muted: '#738078', line: '#D9E1D7', cream: '#FCFBF8', sun: '#F8C957', tomato: '#E87955' };

export function YuzuScreen({ children, scroll = true, style }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const content = scroll ? <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView> : children;
  return <ThemedView style={[styles.screen, style]}><ContextSafeAreaView style={styles.safeArea}>{content}</ContextSafeAreaView></ThemedView>;
}

export function YuzuHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return <View style={styles.header}>{onBack ? <Pressable onPress={onBack} hitSlop={12}><ThemedText style={styles.back}>‹</ThemedText></Pressable> : <View style={styles.backSpace} />}<ThemedText style={styles.headerTitle}>{title}</ThemedText><View style={styles.backSpace} /></View>;
}

export function YuzuButton({ children, onPress, secondary = false, style }: PropsWithChildren<{ onPress?: () => void; secondary?: boolean; style?: ViewStyle }>) {
  return <Pressable onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, style]}><ThemedText style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{children}</ThemedText></Pressable>;
}

export function YuzuCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export const yuzuText: Record<string, TextStyle> = {
  eyebrow: { color: yuzuColors.leaf, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: yuzuColors.ink, fontSize: 26, fontWeight: '800' },
  body: { color: yuzuColors.muted, fontSize: 14, lineHeight: 20 },
};

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: yuzuColors.cream }, safeArea: { flex: 1 }, content: { padding: 20, gap: 14, paddingBottom: 30 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, headerTitle: { color: yuzuColors.ink, fontSize: 21, fontWeight: '800' }, back: { color: yuzuColors.ink, fontSize: 28 }, backSpace: { width: 18 }, button: { minHeight: 50, borderRadius: 15, backgroundColor: yuzuColors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, secondaryButton: { backgroundColor: yuzuColors.sage }, secondaryButtonText: { color: yuzuColors.leaf }, card: { borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: yuzuColors.line, padding: 14 } });
