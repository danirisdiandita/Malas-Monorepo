import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCurrentUser } from "@/hooks/use-auth";

const colors = {
  ink: "#14231A",
  leaf: "#2F6B3E",
  sage: "#DDE8D6",
  sun: "#F8C957",
  tomato: "#E87955",
  muted: "#738078",
  line: "#D9E1D7",
};
type OnboardingStep = {
  eyebrow: string;
  title: string[];
  description: string;
  button: string;
  secondary?: string;
};

const steps: OnboardingStep[] = [
  {
    eyebrow: "RECIPES EVERYWHERE",
    title: ["Found a great recipe?", "Don’t lose it again."],
    description:
      "TikTok, YouTube, and endless links make cooking inspiration easy to find — but hard to track. yuzu saves it in one tap.",
    button: "Save my first recipe",
  },
  {
    eyebrow: "ONE TAP TO SHOP",
    title: ["Recipe in.", "Grocery list ready."],
    description:
      "Turn any saved recipe into a clear grocery list with one tap. No more copying ingredients or wondering what to buy.",
    button: "Make my grocery list",
  },
  {
    eyebrow: "SHOP WITH EASE",
    title: ["Your list is ready.", "Shopping feels simple."],
    description:
      "Everything you need is organized by aisle, so you can check off ingredients quickly and never forget the important stuff.",
    button: "Take me shopping",
  },
  {
    eyebrow: "COOK WITH CONFIDENCE",
    title: ["From saved", "to served."],
    description:
      "Your recipes, groceries, and next meal live together in yuzu — ready whenever you are.",
    button: "Start cooking",
  },
  {
    eyebrow: "PLAN WITHOUT THE PRESSURE",
    title: ["Know what to cook", "next."],
    description:
      "Pick your saved recipes for the week and let yuzu make the plan. Simpler dinners, fewer last-minute decisions.",
    button: "Plan my week",
  },
  {
    eyebrow: "A LIST THAT FITS YOUR LIFE",
    title: ["Only buy what", "you need."],
    description:
      "Set servings, keep track of what you already have, and make every grocery trip feel lighter.",
    button: "Keep it simple",
  },
  {
    eyebrow: "YUZU",
    title: ["Every recipe.", "Right where you left it."],
    description:
      "Save inspiration once, turn it into a grocery list, and plan your meals simply with yuzu.",
    button: "Start cooking",
  },
];

export default function OnboardingScreen() {
  const { data: user } = useCurrentUser();
  const [step, setStep] = useState(0);
  const current = steps[step];
  useEffect(() => {
    if (user) router.replace("/tab1");
  }, [user]);

  const next = () =>
    step === steps.length - 1 ? router.push("/sign-in") : setStep(step + 1);
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.eyebrow}>{current.eyebrow}</ThemedText>
          <ThemedText style={styles.title}>
            {current.title.join("\n")}
          </ThemedText>
          <ThemedText style={styles.description}>
            {current.description}
          </ThemedText>
          <OnboardingVisual step={step} />
          <View style={styles.footer}>
            <View style={styles.progress}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === step && styles.activeDot]}
                />
              ))}
            </View>
            <Pressable style={styles.primaryButton} onPress={next}>
              <ThemedText style={styles.primaryLabel}>
                {current.button}
              </ThemedText>
            </Pressable>
            {current.secondary && (
              <Pressable onPress={() => router.push("/sign-in")}>
                <ThemedText style={styles.secondaryLabel}>
                  {current.secondary}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function OnboardingVisual({ step }: { step: number }) {
  if (step === 0)
    return (
      <View style={styles.illustration}>
        <View style={styles.plate}>
          <View style={styles.food}>
            <View style={styles.greenGarnish} />
            <View style={styles.redGarnish} />
          </View>
        </View>
      </View>
    );
  if (step === 1)
    return (
      <View style={styles.listPanel}>
        <ThemedText style={styles.panelEyebrow}>FROM RECIPE TO LIST</ThemedText>
        {[
          "🍋  Lemon pasta",
          "🌶️  Crispy chili eggs",
          "🥬  Green goddess bowl",
        ].map((item) => (
          <View key={item} style={styles.listRow}>
            <ThemedText style={styles.listText}>{item}</ThemedText>
            <Ionicons name="chevron-forward" size={15} color={colors.muted} />
          </View>
        ))}
      </View>
    );
  if (step === 2 || step === 5)
    return (
      <View style={styles.listPanel}>
        <ThemedText style={styles.panelEyebrow}>
          {step === 2 ? "YOUR SHOPPING LIST" : "SMART LIST"}
        </ThemedText>
        {(step === 2
          ? ["Avocados", "Cherry tomatoes", "Basil", "Pasta"]
          : ["Olive oil", "Garlic", "Parmesan"]
        ).map((item, index) => (
          <View key={item} style={styles.listRow}>
            <View style={styles.check} />
            <ThemedText style={styles.listText}>{item}</ThemedText>
            <ThemedText style={styles.quantity}>
              {["2 ripe", "1 pint", "1 bunch", "400 g"][index] ||
                ["1 bottle", "1 bulb", "200 g"][index]}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  if (step === 4)
    return (
      <View style={styles.weekPanel}>
        <ThemedText style={styles.panelEyebrow}>THIS WEEK</ThemedText>
        {[
          "MON  🍋  Lemon pasta",
          "WED  🌶️  Crispy chili eggs",
          "FRI  🥬  Green goddess bowl",
        ].map((item) => (
          <ThemedText key={item} style={styles.weekRow}>
            {item}
          </ThemedText>
        ))}
      </View>
    );
  return (
    <View style={styles.syncPanel}>
      <Ionicons name="restaurant-outline" size={55} color={colors.leaf} />
      <ThemedText style={styles.syncText}>RECIPES · LISTS · PLANS</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFBF8" },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  eyebrow: {
    color: colors.leaf,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 33,
    lineHeight: 35,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 330,
  },
  illustration: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  plate: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  food: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: colors.sun,
    position: "relative",
  },
  greenGarnish: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.leaf,
    top: 22,
    left: 34,
  },
  redGarnish: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.tomato,
    right: 25,
    bottom: 27,
  },
  listPanel: {
    width: "100%",
    backgroundColor: colors.sage,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    marginTop: 26,
  },
  panelEyebrow: {
    color: colors.leaf,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  listRow: {
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFFAA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
  },
  listText: { color: colors.ink, fontSize: 16, fontWeight: "700", flex: 1 },
  check: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.leaf,
  },
  quantity: { color: colors.muted, fontSize: 14 },
  weekPanel: {
    width: "100%",
    backgroundColor: colors.sage,
    borderRadius: 24,
    padding: 22,
    gap: 16,
    marginTop: 26,
  },
  weekRow: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  syncPanel: {
    width: 220,
    height: 180,
    borderRadius: 28,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 26,
  },
  syncText: {
    color: colors.leaf,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 24,
  },
  progress: { flexDirection: "row", gap: 6, marginBottom: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  activeDot: { width: 24, backgroundColor: colors.leaf },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  primaryLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  secondaryLabel: {
    color: colors.leaf,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 13,
  },
});
