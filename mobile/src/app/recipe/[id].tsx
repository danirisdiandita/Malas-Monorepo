import Ionicons from '@react-native-vector-icons/ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { yuzuColors } from '@/components/yuzu-screen';
import { useRecipe } from '@/hooks/use-recipe';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === 'string' ? id : '';
  const { data: recipe, isPending, isError } = useRecipe(recipeId);
  const [favorite, setFavorite] = useState(false);

  if (isPending) return <StatusScreen message="Loading recipe..." />;
  if (isError || !recipe) return <StatusScreen message="Recipe not found." />;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View style={styles.imagePlaceholder} accessibilityLabel="Recipe image placeholder">
              <ThemedText style={styles.heroEmoji}>🍋</ThemedText>
              <ThemedText style={styles.placeholderLabel}>Recipe image</ThemedText>
            </View>
            <Pressable style={[styles.circleButton, styles.backButton]} onPress={() => router.back()} accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={22} color={yuzuColors.ink} />
            </Pressable>
            <Pressable style={[styles.circleButton, styles.favoriteButton]} onPress={() => setFavorite((value) => !value)} accessibilityLabel="Favorite recipe">
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={21} color={yuzuColors.tomato} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <ThemedText style={styles.source}>{recipe.tags.join(' · ').toUpperCase() || 'RECIPE'}</ThemedText>
            <ThemedText style={styles.title}>{recipe.name}</ThemedText>
            <ThemedText style={styles.intro}>Bright, silky, and ready in {recipe.process_minutes} minutes.</ThemedText>
            <View style={styles.metadata}>
              <Meta icon="time-outline" label={`${recipe.process_minutes} min`} />
              <Meta icon="sparkles-outline" label={recipe.difficulty} />
              <Meta icon="people-outline" label={`${recipe.servings} servings`} />
            </View>
            <View style={styles.nutrition}>
              <ThemedText style={styles.nutritionTitle}>NUTRITION / SERVING</ThemedText>
              {[['520 kcal', 'Calories'], ['16 g', 'Protein'], ['68 g', 'Carbs'], ['19 g', 'Fat']].map(([value, label]) => (
                <View key={label} style={styles.nutritionItem}><ThemedText style={styles.nutritionValue}>{value}</ThemedText><ThemedText style={styles.nutritionLabel}>{label}</ThemedText></View>
              ))}
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}><ThemedText style={styles.heading}>Ingredients</ThemedText><ThemedText style={styles.count}>{recipe.ingredients.length} items</ThemedText></View>
              {recipe.ingredients.map((ingredient, index) => <ThemedText key={`${index}-${ingredient}`} style={styles.ingredient}>{ingredient}</ThemedText>)}
            </View>
            <View style={styles.section}>
              <ThemedText style={styles.heading}>Directions</ThemedText>
              {recipe.instructions.map((instruction, index) => (
                <View key={`${index}-${instruction}`} style={styles.step}><View style={styles.stepNumber}><ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText></View><ThemedText style={styles.stepText}>{instruction}</ThemedText></View>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.groceryButton} onPress={() => router.push('/groceries')} accessibilityRole="button">
            <Ionicons name="bag-handle-outline" size={19} color={yuzuColors.sun} /><ThemedText style={styles.groceryLabel}>Add ingredients to grocery list</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatusScreen({ message }: { message: string }) {
  return <ThemedView style={styles.statusScreen}><ThemedText style={styles.status}>{message}</ThemedText></ThemedView>;
}

function Meta({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return <View style={styles.meta}><Ionicons name={icon} size={15} color={yuzuColors.leaf} /><ThemedText style={styles.metaLabel}>{label}</ThemedText></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7F1' }, safeArea: { flex: 1 }, scrollContent: { paddingBottom: 12 },
  hero: { height: 190, backgroundColor: '#FCE6B4', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' }, heroEmoji: { fontSize: 82, lineHeight: 94 }, placeholderLabel: { color: '#9D804A', fontSize: 10, fontWeight: '700', opacity: 0.75 },
  circleButton: { position: 'absolute', top: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFFCC', alignItems: 'center', justifyContent: 'center' }, backButton: { left: 16 }, favoriteButton: { right: 16 },
  content: { paddingHorizontal: 20, paddingTop: 18 }, source: { color: yuzuColors.tomato, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { color: yuzuColors.ink, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 6 }, intro: { color: yuzuColors.muted, fontSize: 14, marginTop: 4 },
  metadata: { flexDirection: 'row', gap: 8, marginTop: 14 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 }, metaLabel: { color: yuzuColors.ink, fontSize: 11, fontWeight: '800' },
  nutrition: { minHeight: 58, marginTop: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, nutritionTitle: { color: yuzuColors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }, nutritionItem: { alignItems: 'center', gap: 2 }, nutritionValue: { color: yuzuColors.ink, fontSize: 11, fontWeight: '800' }, nutritionLabel: { color: yuzuColors.muted, fontSize: 9 },
  section: { marginTop: 22 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, heading: { color: yuzuColors.ink, fontSize: 19, fontWeight: '900' }, count: { color: yuzuColors.muted, fontSize: 11 }, ingredient: { color: yuzuColors.ink, fontSize: 13, fontWeight: '700', paddingVertical: 7 },
  step: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingVertical: 6 }, stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E1EEDC', alignItems: 'center', justifyContent: 'center' }, stepNumberText: { color: yuzuColors.leaf, fontSize: 12, fontWeight: '900' }, stepText: { flex: 1, color: yuzuColors.ink, fontSize: 12, lineHeight: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 8 }, groceryButton: { height: 52, borderRadius: 18, backgroundColor: yuzuColors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: yuzuColors.ink, shadowOpacity: 0.14, shadowRadius: 7, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, groceryLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  statusScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: yuzuColors.cream }, status: { color: yuzuColors.muted, fontSize: 16 },
});
