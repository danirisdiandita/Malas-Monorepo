import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { yuzuColors } from "@/components/yuzu-screen";
import { useRateRecipe, useRecipe } from "@/hooks/use-recipe";
import { RecipeImage } from "@/components/recipe-image";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === "string" ? id : "";
  const { data: recipe, isPending, isError } = useRecipe(recipeId);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [copied, setCopied] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<number, boolean>
  >({});
  const [checkedDirections, setCheckedDirections] = useState<
    Record<number, boolean>
  >({});
  const rateRecipe = useRateRecipe(recipeId);

  if (isPending) return <StatusScreen message="Loading recipe..." />;
  if (isError || !recipe) return <StatusScreen message="Recipe not found." />;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.hero}>
            {recipe.image_url ? (
              <Fragment>
                <RecipeImage url={recipe.image_url} />
                {/*<View style={styles.imageURLDebug}>
                  <Text style={styles.imageURLText} selectable numberOfLines={2}>
                    {recipe.image_url}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Copy recipe image URL"
                    onPress={async () => {
                      await Clipboard.setStringAsync(recipe.image_url ?? "");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    <Ionicons
                      name={copied ? "checkmark" : "copy-outline"}
                      size={18}
                      color={yuzuColors.ink}
                    />
                  </Pressable>
                </View>*/}
              </Fragment>
            ) : (
              <View
                style={styles.imagePlaceholder}
                accessibilityLabel="Recipe image placeholder"
              >
                <ThemedText style={styles.heroEmoji}>🍋</ThemedText>
                <ThemedText style={styles.placeholderLabel}>
                  Recipe image
                </ThemedText>
              </View>
            )}
            <Pressable
              style={[styles.circleButton, styles.backButton]}
              onPress={() => router.replace("/recipes")}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={yuzuColors.ink} />
            </Pressable>
            <Pressable
              style={[styles.circleButton, styles.favoriteButton]}
              onPress={() => {
                setSelectedRating(recipe.rating ?? 0);
                setRatingOpen(true);
              }}
              accessibilityLabel="Rate recipe"
            >
              <Ionicons
                name={recipe.rating ? "heart" : "heart-outline"}
                size={21}
                color={yuzuColors.tomato}
              />
            </Pressable>
          </View>

          <View style={styles.content}>
            <ThemedText style={styles.source}>
              {recipe.tags.join(" · ").toUpperCase() || "RECIPE"}
            </ThemedText>
            <ThemedText style={styles.title}>{recipe.name}</ThemedText>
            {!!recipe.notes && (
              <ThemedText style={styles.intro}>{recipe.notes}</ThemedText>
            )}
            {!!recipe.url && (
              <Pressable
                accessibilityRole="link"
                style={styles.sourceLink}
                onPress={() => Linking.openURL(recipe.url as string)}
              >
                <Ionicons
                  name="open-outline"
                  size={15}
                  color={yuzuColors.leaf}
                />
                <ThemedText style={styles.sourceLinkLabel}>
                  View original source
                </ThemedText>
              </Pressable>
            )}
            <View style={styles.metadata}>
              {recipe.process_minutes > 0 && (
                <Meta
                  icon="time-outline"
                  label={`${recipe.process_minutes} min`}
                />
              )}
              {!!recipe.difficulty && (
                <Meta icon="sparkles-outline" label={recipe.difficulty} />
              )}
              {recipe.servings > 0 && (
                <Meta
                  icon="people-outline"
                  label={`${recipe.servings} servings`}
                />
              )}
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.heading}>Ingredients</ThemedText>
                <ThemedText style={styles.count}>
                  {recipe.ingredients.length} items
                </ThemedText>
              </View>
              {recipe.ingredients.map((ingredient, index) => {
                const checked = checkedIngredients[index] === true;
                return (
                  <Pressable
                    key={`${index}-${ingredient}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() =>
                      setCheckedIngredients((current) => ({
                        ...current,
                        [index]: !checked,
                      }))
                    }
                    style={styles.ingredientRow}
                  >
                    <Ionicons
                      name={checked ? "checkmark-circle" : "ellipse-outline"}
                      size={21}
                      color={checked ? yuzuColors.leaf : yuzuColors.muted}
                    />
                    <ThemedText
                      style={[
                        styles.ingredient,
                        checked && styles.ingredientChecked,
                      ]}
                    >
                      {ingredient}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.section}>
              <ThemedText style={styles.heading}>Directions</ThemedText>
              {recipe.instructions.map((instruction, index) => {
                const checked = checkedDirections[index] === true;
                return (
                  <Pressable
                    key={`${index}-${instruction}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() =>
                      setCheckedDirections((current) => ({
                        ...current,
                        [index]: !checked,
                      }))
                    }
                    style={styles.step}
                  >
                    <View style={styles.stepNumber}>
                      <ThemedText style={styles.stepNumberText}>
                        {index + 1}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={[styles.stepText, checked && styles.stepChecked]}
                    >
                      {instruction}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            style={styles.groceryButton}
            onPress={() => router.push("/groceries")}
            accessibilityRole="button"
          >
            <Ionicons
              name="bag-handle-outline"
              size={19}
              color={yuzuColors.sun}
            />
            <ThemedText style={styles.groceryLabel}>
              Add ingredients to grocery list
            </ThemedText>
          </Pressable>
        </View>
        <Modal
          visible={ratingOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setRatingOpen(false)}
        >
          <Pressable
            style={styles.ratingBackdrop}
            onPress={() => setRatingOpen(false)}
          >
            <Pressable
              style={styles.ratingModal}
              onPress={(event) => event.stopPropagation()}
            >
              <ThemedText style={styles.ratingTitle}>
                Rate this recipe
              </ThemedText>
              <ThemedText style={styles.ratingBody}>
                How much do you love it?
              </ThemedText>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} stars`}
                    onPress={() => setSelectedRating(value)}
                  >
                    <Ionicons
                      name={value <= selectedRating ? "star" : "star-outline"}
                      size={34}
                      color={yuzuColors.sun}
                    />
                  </Pressable>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={selectedRating === 0 || rateRecipe.isPending}
                style={[
                  styles.saveRating,
                  (selectedRating === 0 || rateRecipe.isPending) &&
                    styles.saveRatingDisabled,
                ]}
                onPress={() =>
                  rateRecipe.mutate(selectedRating, {
                    onSuccess: () => setRatingOpen(false),
                  })
                }
              >
                <ThemedText style={styles.saveRatingLabel}>
                  {rateRecipe.isPending ? "Saving..." : "Save rating"}
                </ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatusScreen({ message }: { message: string }) {
  return (
    <ThemedView style={styles.statusScreen}>
      <ThemedText style={styles.status}>{message}</ThemedText>
    </ThemedView>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={yuzuColors.leaf} />
      <ThemedText style={styles.metaLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7F1" },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 12 },
  hero: {
    height: 190,
    backgroundColor: "#FCE6B4",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageURLDebug: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFFE6",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageURLText: {
    flex: 1,
    color: yuzuColors.ink,
    fontSize: 10,
    lineHeight: 13,
  },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 82, lineHeight: 94 },
  placeholderLabel: {
    color: "#9D804A",
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.75,
  },
  circleButton: {
    position: "absolute",
    top: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFFCC",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: { left: 16 },
  favoriteButton: { right: 16 },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  source: {
    color: yuzuColors.tomato,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: yuzuColors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    marginTop: 6,
  },
  intro: { color: yuzuColors.muted, fontSize: 14, marginTop: 4 },
  sourceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  sourceLinkLabel: { color: yuzuColors.leaf, fontSize: 13, fontWeight: "800" },
  ratingBackdrop: {
    flex: 1,
    backgroundColor: "#14231A66",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  ratingModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    backgroundColor: "#FCFBF8",
    padding: 22,
    alignItems: "center",
    gap: 8,
  },
  ratingTitle: { color: yuzuColors.ink, fontSize: 22, fontWeight: "900" },
  ratingBody: { color: yuzuColors.muted, fontSize: 14 },
  ratingStars: { flexDirection: "row", gap: 7, marginVertical: 10 },
  saveRating: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    backgroundColor: yuzuColors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveRatingDisabled: { opacity: 0.45 },
  saveRatingLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  metadata: { flexDirection: "row", gap: 8, marginTop: 14 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaLabel: { color: yuzuColors.ink, fontSize: 11, fontWeight: "800" },
  nutrition: {
    minHeight: 58,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nutritionTitle: {
    color: yuzuColors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  nutritionItem: { alignItems: "center", gap: 2 },
  nutritionValue: { color: yuzuColors.ink, fontSize: 11, fontWeight: "800" },
  nutritionLabel: { color: yuzuColors.muted, fontSize: 9 },
  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  heading: { color: yuzuColors.ink, fontSize: 19, fontWeight: "900" },
  count: { color: yuzuColors.muted, fontSize: 11 },
  ingredient: {
    color: yuzuColors.ink,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 5,
  },
  ingredientChecked: {
    color: yuzuColors.muted,
    textDecorationLine: "line-through",
  },
  step: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E1EEDC",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: yuzuColors.leaf, fontSize: 12, fontWeight: "900" },
  stepText: { flex: 1, color: yuzuColors.ink, fontSize: 12, lineHeight: 16 },
  stepChecked: { color: yuzuColors.muted, textDecorationLine: "line-through" },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  groceryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: yuzuColors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: yuzuColors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  groceryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  statusScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: yuzuColors.cream,
  },
  status: { color: yuzuColors.muted, fontSize: 16 },
});
