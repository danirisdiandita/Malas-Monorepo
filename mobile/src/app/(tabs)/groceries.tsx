import { Ionicons } from "@react-native-vector-icons/ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useClearGroceries, useGroceries } from "@/hooks/use-groceries";
import { toast } from "sonner-native";
import type { Grocery } from "@/lib/api";
import { decimalAsFraction } from "@/lib/fractions";
import { RecipeImage } from "@/components/recipe-image";

const colors = {
  ink: "#14231A",
  leaf: "#4E8B5B",
  sage: "#DDE8D6",
  muted: "#738078",
  line: "#D9E1D7",
  tomato: "#E87955",
};
export default function GroceriesScreen() {
  const { data: groceries, isPending, isError } = useGroceries();
  const clearGroceries = useClearGroceries();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const items = groceries ?? [];
  const checkedCount = items.filter((item) => checked[item.id] ?? item.checked).length;
  const groups = groupGroceries(items);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>Grocery list</ThemedText>
            </View>
            {items.length > 0 && (
              <Pressable
                onPress={() => setClearConfirmOpen(true)}
                disabled={clearGroceries.isPending}
                accessibilityRole="button"
                accessibilityLabel="Clear all groceries"
              >
                <ThemedText style={styles.clearAll}>Clear all</ThemedText>
              </Pressable>
            )}
          </View>
          {isPending ? <ThemedText style={styles.status}>Loading groceries...</ThemedText> : isError ? <ThemedText style={styles.status}>Unable to load groceries.</ThemedText> : items.length === 0 ? <EmptyGroceries /> : <>
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <ThemedText style={styles.progressLabel}>{checkedCount} of {items.length} items</ThemedText>
              <ThemedText style={styles.progressHint}>{checkedCount === items.length ? "All done" : "Keep going"}</ThemedText>
            </View>
            <View style={styles.track}>
              <View style={[styles.progress, { width: `${(checkedCount / items.length) * 100}%` }]} />
            </View>
          </View>
          {groups.map((group) => (
            <View key={group.title} style={styles.group}>
              {group.items[0]?.recipe_name ? <Pressable style={styles.recipeCard} onPress={() => setCollapsedGroups((current) => ({ ...current, [group.items[0].recipe_id ?? group.title]: !current[group.items[0].recipe_id ?? group.title] }))} accessibilityRole="button" accessibilityState={{ expanded: !collapsedGroups[group.items[0].recipe_id ?? group.title] }}>
                <View style={styles.recipeThumb}>{group.items[0].recipe_image_url ? <RecipeImage url={group.items[0].recipe_image_url} /> : <Ionicons name="book-outline" size={22} color={colors.leaf} />}</View>
                <View style={styles.recipeCardText}><ThemedText style={styles.groupTitle} numberOfLines={2}>{group.title}</ThemedText><ThemedText style={styles.count}>{group.items.length} items</ThemedText></View>
                <Ionicons name={collapsedGroups[group.items[0].recipe_id ?? group.title] ? "chevron-down" : "chevron-up"} size={20} color={colors.muted} />
              </Pressable> : <View style={styles.groupHeader}><ThemedText style={styles.groupTitle}>{group.title}</ThemedText><ThemedText style={styles.count}>{group.items.length} items</ThemedText></View>}
              {!group.items[0]?.recipe_name || !collapsedGroups[group.items[0].recipe_id ?? group.title] ? group.items.map((item) => {
                const isChecked = checked[item.id] ?? item.checked;
                return <Pressable key={item.id} style={styles.item} onPress={() => setChecked((current) => ({ ...current, [item.id]: !isChecked }))} accessibilityRole="checkbox" accessibilityState={{ checked: isChecked }}>
                  <View style={[styles.checkbox, isChecked && styles.checked]}>
                    {isChecked && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                  <ThemedText
                    style={[styles.itemName, isChecked && styles.completed]}
                  >
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.quantity}>{[item.quantity == null ? "" : decimalAsFraction(item.quantity), item.unit].filter(Boolean).join(" ")}</ThemedText>
                </Pressable>;
              }) : null}
            </View>
          ))}</>}
        </ScrollView>
        <Modal visible={clearConfirmOpen} transparent animationType="fade" onRequestClose={() => setClearConfirmOpen(false)}>
          <Pressable style={styles.confirmBackdrop} onPress={() => setClearConfirmOpen(false)}>
            <Pressable style={styles.confirmModal} onPress={(event) => event.stopPropagation()}>
              <View style={styles.confirmIcon}><Ionicons name="trash-outline" size={24} color={colors.tomato} /></View>
              <ThemedText style={styles.confirmTitle}>Clear grocery list?</ThemedText>
              <ThemedText style={styles.confirmBody}>All {items.length} current grocery items will be permanently deleted.</ThemedText>
              <View style={styles.confirmActions}>
                <Pressable style={styles.cancelButton} onPress={() => setClearConfirmOpen(false)} disabled={clearGroceries.isPending}>
                  <ThemedText style={styles.cancelLabel}>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.clearConfirmButton, clearGroceries.isPending && styles.disabled]}
                  onPress={() => clearGroceries.mutate(undefined, { onSuccess: () => { setClearConfirmOpen(false); setChecked({}); toast.success("Grocery list cleared"); }, onError: (error) => toast.error(error.message) })}
                  disabled={clearGroceries.isPending}
                >
                  {clearGroceries.isPending ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.confirmDeleteLabel}>Clear all</ThemedText>}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

function EmptyGroceries() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={42} color={colors.leaf} /></View>
      <ThemedText style={styles.emptyTitle}>Your grocery list is empty</ThemedText>
      <ThemedText style={styles.emptyBody}>Add ingredients from a saved recipe and we’ll organize your shopping trip for you.</ThemedText>
      <Pressable disabled style={styles.emptyButton} accessibilityRole="button" accessibilityLabel="Add ingredients from a recipe">
        <Ionicons name="add" size={19} color="#FFFFFF" />
        <ThemedText style={styles.emptyButtonLabel}>Add from a recipe</ThemedText>
      </Pressable>
      <ThemedText style={styles.emptyHint}>Recipe linking will be available soon.</ThemedText>
    </View>
  );
}

function groupGroceries(items: Grocery[]) {
  const groups = new Map<string, Grocery[]>();
  for (const item of items) {
    const title = item.recipe_name || "Other groceries";
    groups.set(title, [...(groups.get(title) ?? []), item]);
  }
  return [...groups.entries()].map(([title, groupItems]) => ({ title, items: groupItems }));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFBF8" },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, padding: 20, gap: 18, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.leaf,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 3 },
  clearAll: { color: colors.tomato, fontSize: 13, fontWeight: "800" },
  progressCard: {
    backgroundColor: colors.sage,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  progressHint: { color: colors.leaf, fontSize: 13 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF99",
    overflow: "hidden",
  },
  progress: {
    width: "25%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.leaf,
  },
  group: { gap: 12 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  count: { color: colors.muted, fontSize: 13 },
  recipeCard: { minHeight: 72, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.line, padding: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  recipeThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.sage, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  recipeCardText: { flex: 1, gap: 3 },
  item: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 9 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: colors.leaf, borderColor: colors.leaf },
  itemName: { color: colors.ink, fontSize: 16, fontWeight: "700", flex: 1 },
  completed: { color: colors.muted, textDecorationLine: "line-through" },
  quantity: { color: colors.muted, fontSize: 14 },
  status: { color: colors.muted, fontSize: 15, textAlign: "center", paddingVertical: 24 },
  emptyState: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingHorizontal: 12, gap: 12 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#EAF5DE", borderWidth: 2, borderColor: "#D7EBC4", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { color: colors.ink, fontSize: 23, fontWeight: "900", textAlign: "center" },
  emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 306 },
  emptyButton: { width: 242, height: 52, borderRadius: 16, backgroundColor: colors.tomato, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 8, opacity: 0.55 },
  emptyButtonLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  emptyHint: { color: "#9AA79F", fontSize: 11, fontWeight: "700", textAlign: "center" },
  confirmBackdrop: { flex: 1, backgroundColor: "#14231A66", alignItems: "center", justifyContent: "center", padding: 20 },
  confirmModal: { width: "100%", maxWidth: 360, borderRadius: 24, backgroundColor: "#FCFBF8", padding: 22, alignItems: "center", gap: 9 },
  confirmIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FCE2D8", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  confirmTitle: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  confirmBody: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  confirmActions: { width: "100%", flexDirection: "row", gap: 9, marginTop: 8 },
  cancelButton: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  cancelLabel: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  clearConfirmButton: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.tomato, alignItems: "center", justifyContent: "center" },
  confirmDeleteLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.45 },
});
