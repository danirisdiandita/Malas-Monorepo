import { Ionicons } from "@react-native-vector-icons/ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useGroceries } from "@/hooks/use-groceries";
import type { Grocery } from "@/lib/api";

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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const items = groceries ?? [];
  const checkedCount = items.filter((item) => checked[item.id]).length;
  const groups = groupGroceries(items);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>Grocery list</ThemedText>
            </View>
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
              <View style={styles.groupHeader}>
                <ThemedText style={styles.groupTitle}>{group.title}</ThemedText>
                <ThemedText style={styles.count}>{group.items.length} items</ThemedText>
              </View>
              {group.items.map((item) => {
                const isChecked = checked[item.id] === true;
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
                  <ThemedText style={styles.quantity}>{[item.quantity, item.unit].filter(Boolean).join(" ")}</ThemedText>
                </Pressable>;
              })}
            </View>
          ))}</>}
        </ScrollView>
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
    const title = item.tag || "Other";
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
});
