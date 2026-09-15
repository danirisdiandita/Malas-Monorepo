import BottomSheet, { BottomSheetScrollView, BottomSheetView, type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState, type RefObject } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { toast } from "sonner-native";
import type { PurchasesPackage } from "react-native-purchases";

import { ThemedText } from "@/components/themed-text";
import { useCurrentUser } from "@/hooks/use-auth";
import { getSubscriptionPackages, hasYuzuPro, purchaseSubscription, restoreSubscriptions } from "@/lib/revenuecat";

const benefits = ["Unlimited recipe imports", "Smart grocery lists", "Flexible meal planning"];
const packageOrder = ["$rc_weekly", "$rc_annual", "$rc_monthly"];

export function UpgradeSubscriptionSheet({ sheetRef }: { sheetRef: RefObject<BottomSheetMethods | null> }) {
  const user = useCurrentUser();
  const [selectedID, setSelectedID] = useState<string>();
  const offerings = useQuery({ queryKey: ["revenuecat", "offerings", user.data?.id], queryFn: getSubscriptionPackages, enabled: Boolean(user.data?.id), retry: false });
  const packages = useMemo(() => [...(offerings.data ?? [])].sort((a, b) => packageOrder.indexOf(a.identifier) - packageOrder.indexOf(b.identifier)), [offerings.data]);
  const selectedPackage = packages.find((item) => item.identifier === selectedID) ?? packages[0];
  const purchase = useMutation({
    mutationFn: () => purchaseSubscription(selectedPackage!),
    onSuccess: ({ customerInfo }) => { if (hasYuzuPro(customerInfo)) { toast.success("Yuzu Pro is active"); sheetRef.current?.close(); } else toast.error("The purchase completed, but Yuzu Pro is not active yet."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to complete purchase."),
  });
  const restore = useMutation({
    mutationFn: restoreSubscriptions,
    onSuccess: (customerInfo) => { if (hasYuzuPro(customerInfo)) { toast.success("Yuzu Pro restored"); sheetRef.current?.close(); } else toast.error("No active Yuzu Pro subscription was found."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to restore purchases."),
  });
  const busy = purchase.isPending || restore.isPending;

  return <BottomSheet ref={sheetRef} index={-1} snapPoints={["92%"]} enablePanDownToClose backgroundStyle={styles.sheet}>
    <BottomSheetView style={styles.container}>
      <View style={styles.header}><View><ThemedText style={styles.eyebrow}>YUZU PRO</ThemedText><ThemedText style={styles.title}>Unlock Unlimited Recipes</ThemedText></View><Pressable accessibilityLabel="Close upgrade sheet" disabled={busy} hitSlop={10} onPress={() => sheetRef.current?.close()}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
      <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.subtitle}>Keep every recipe, grocery list, and meal plan in one calm kitchen.</ThemedText>
        <View style={styles.benefits}>{benefits.map((benefit) => <View key={benefit} style={styles.benefit}><Ionicons name="checkmark-circle" size={19} color={colors.leaf} /><ThemedText style={styles.benefitText}>{benefit}</ThemedText></View>)}</View>
        {offerings.isPending ? <ActivityIndicator color={colors.leaf} style={styles.loader} /> : offerings.isError ? <ThemedText style={styles.error}>Plans are unavailable right now. Please try again.</ThemedText> : packages.length === 0 ? <ThemedText style={styles.error}>No subscription plans are configured yet.</ThemedText> : <View style={styles.plans}>{packages.map((item) => <Plan key={item.identifier} item={item} selected={item.identifier === selectedPackage?.identifier} onPress={() => setSelectedID(item.identifier)} />)}</View>}
      </BottomSheetScrollView>
      <View style={styles.footer}><Pressable disabled={busy || !selectedPackage || offerings.isPending} style={[styles.purchase, (busy || !selectedPackage || offerings.isPending) && styles.disabled]} onPress={() => purchase.mutate()}>{purchase.isPending ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.purchaseText}>Get Yuzu Pro</ThemedText>}</Pressable><Pressable disabled={busy} onPress={() => restore.mutate()} style={styles.restore}>{restore.isPending ? <ActivityIndicator color={colors.leaf} /> : <ThemedText style={styles.restoreText}>Restore purchases</ThemedText>}</Pressable><ThemedText style={styles.note}>Subscriptions renew automatically. Manage or cancel them in your App Store or Google Play account.</ThemedText></View>
    </BottomSheetView>
  </BottomSheet>;
}

function Plan({ item, selected, onPress }: { item: PurchasesPackage; selected: boolean; onPress: () => void }) {
  const label = item.identifier === "$rc_annual" ? "Yearly" : item.identifier === "$rc_monthly" ? "Monthly" : "Weekly";
  return <Pressable onPress={onPress} style={[styles.plan, selected && styles.selectedPlan]} accessibilityRole="radio" accessibilityState={{ selected }}><View style={styles.planCopy}><ThemedText style={styles.planLabel}>{label}</ThemedText>{label === "Yearly" && <ThemedText style={styles.bestValue}>BEST VALUE</ThemedText>}</View><ThemedText style={styles.price}>{item.product.priceString}</ThemedText></Pressable>;
}

const colors = { ink: "#14231A", leaf: "#4E8B5B", sage: "#DDE8D6", muted: "#738078", line: "#D9E1D7", cream: "#FCFBF8", tomato: "#E87955" };
const styles = StyleSheet.create({
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  container: { flex: 1, paddingTop: 16 },
  header: { paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: colors.tomato, fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  title: { color: colors.ink, fontSize: 25, fontWeight: "800", maxWidth: 300 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 12, gap: 16, paddingBottom: 20 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  benefits: { gap: 10 },
  benefit: { flexDirection: "row", gap: 9, alignItems: "center" },
  benefitText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  plans: { gap: 9 },
  plan: { minHeight: 60, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: "#fff", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedPlan: { borderColor: colors.leaf, borderWidth: 2, backgroundColor: colors.sage },
  planCopy: { gap: 3 },
  planLabel: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  bestValue: { color: colors.leaf, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  price: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  loader: { marginVertical: 20 },
  error: { color: colors.muted, textAlign: "center", paddingVertical: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, gap: 4, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.cream },
  purchase: { minHeight: 52, borderRadius: 16, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  purchaseText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  restore: { minHeight: 30, alignItems: "center", justifyContent: "center" },
  restoreText: { color: colors.leaf, fontSize: 13, fontWeight: "800" },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  disabled: { opacity: 0.55 },
});
