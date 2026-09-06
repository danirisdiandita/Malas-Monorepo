import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { YuzuButton, YuzuHeader, YuzuScreen, yuzuColors, yuzuText } from '@/components/yuzu-screen';

export default function RecipePreviewScreen() {
  return <YuzuScreen><YuzuHeader title="Recipe preview" onBack={() => router.back()} /><View style={styles.hero}><ThemedText style={styles.emoji}>🍋</ThemedText></View><ThemedText style={yuzuText.eyebrow}>PASTA · DINNER</ThemedText><ThemedText style={yuzuText.title}>Creamy lemon pasta</ThemedText><ThemedText style={yuzuText.body}>Bright, silky, and ready in 15 minutes.</ThemedText><View style={styles.meta}><ThemedText style={styles.metaText}>15 min</ThemedText><ThemedText style={styles.metaText}>Easy</ThemedText><ThemedText style={styles.metaText}>2 servings</ThemedText></View><ThemedText style={styles.heading}>Ingredients</ThemedText>{['Spaghetti · 200 g', 'Lemon · 1', 'Parmesan · 50 g', 'Olive oil · 2 tbsp'].map((item) => <View key={item} style={styles.ingredient}><ThemedText style={styles.item}>{item}</ThemedText></View>)}<YuzuButton onPress={() => router.push('/tab2')}>Add ingredients to grocery list</YuzuButton></YuzuScreen>;
}

const styles = StyleSheet.create({ hero: { height: 150, borderRadius: 18, backgroundColor: '#F8E5A9', alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 60 }, meta: { flexDirection: 'row', gap: 8, marginVertical: 10 }, metaText: { color: yuzuColors.leaf, backgroundColor: yuzuColors.sage, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 10, fontWeight: '700' }, heading: { color: yuzuColors.ink, fontSize: 18, fontWeight: '800', marginTop: 8 }, ingredient: { minHeight: 32, borderBottomWidth: 1, borderBottomColor: yuzuColors.line, justifyContent: 'center' }, item: { color: yuzuColors.ink, fontSize: 13 } });
