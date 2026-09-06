import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  YuzuButton,
  YuzuScreen,
  yuzuColors,
  yuzuText,
} from "@/components/yuzu-screen";

const benefits = [
  "Unlimited recipe imports",
  "Smart grocery lists",
  "Flexible meal planning",
  "Pantry tracking",
];

export default function PaywallScreen() {
  return (
    <YuzuScreen>
      <View style={styles.header}><View /><Pressable accessibilityLabel="Close paywall" hitSlop={8} style={styles.closeButton} onPress={() => router.back()}><Ionicons name="close" size={22} color={yuzuColors.ink} /></Pressable></View>
      <View style={styles.hero}>
        <ThemedText style={styles.eyebrow}>YUZU PRO</ThemedText>
        <ThemedText style={styles.title}>
          Your best cooking starts here.
        </ThemedText>
      </View>
      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={yuzuColors.sun}
            />
            <ThemedText style={styles.benefitText}>{benefit}</ThemedText>
          </View>
        ))}
      </View>
      <View style={styles.plans}>
        <Plan title="Yearly plan · Best value" price="$60 / year" />
        <Plan title="Monthly plan" price="$15 / month" />
        <Plan title="Weekly plan" price="$8 / week" />
      </View>
      <ThemedText style={[yuzuText.body, styles.trialCopy]}>
        Try yuzu Pro free for one week so you can cook with less stress and
        more joy.
      </ThemedText>
      <YuzuButton onPress={() => router.back()}>
        Start 7-day free trial
      </YuzuButton>
      <ThemedText style={styles.note}>
        Cancel anytime. No commitment.
      </ThemedText>
    </YuzuScreen>
  );
}

function Plan({ title, price }: { title: string; price: string }) {
  return (
    <View style={styles.plan}>
      <ThemedText style={styles.planTitle}>{title}</ThemedText>
      <ThemedText style={styles.price}>{price}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: yuzuColors.sage },
  hero: {
    alignItems: "center",
    backgroundColor: yuzuColors.ink,
    borderRadius: 20,
    padding: 22,
    gap: 8,
  },
  eyebrow: {
    color: yuzuColors.sun,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "center",
  },
  benefits: {
    backgroundColor: "#274333",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginTop: 12,
  },
  benefit: { flexDirection: "row", alignItems: "center", gap: 9 },
  benefitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  plans: { gap: 9 },
  plan: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: yuzuColors.line,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planTitle: { color: yuzuColors.ink, fontSize: 16, fontWeight: "700" },
  price: { color: yuzuColors.leaf, fontSize: 16, fontWeight: "900" },
  note: { color: yuzuColors.muted, fontSize: 12, textAlign: "center" },
  trialCopy: { textAlign: "center" },
});
