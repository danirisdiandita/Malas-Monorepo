import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
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
  index: number;
  eyebrow: string;
  title: string[];
  description: string;
  button: string;
  secondary?: string;
};

const steps: OnboardingStep[] = [
  {
    index: 0,
    eyebrow: "RECIPES EVERYWHERE",
    title: ["Found a great recipe?", "Don’t lose it again."],
    description:
      "TikTok, YouTube, and endless links make cooking inspiration easy to find — but hard to track. yuzu saves it in one tap.",
    button: "Continue",
  },
  {
    index: 1,
    eyebrow: "ONE TAP TO SHOP",
    title: ["Recipe in.", "Grocery list ready."],
    description:
      "Turn any saved recipe into a clear grocery list with one tap. No more copying ingredients or wondering what to buy.",
    button: "Continue",
  },
  {
    index: 2,
    eyebrow: "PLAN WITHOUT THE PRESSURE",
    title: ["Know what to cook", "next."],
    description:
      "Pick your saved recipes for the week and let yuzu make the plan. Simpler dinners, fewer last-minute decisions.",
    button: "Continue",
  },
];

export default function OnboardingScreen() {
  const { data: user, isPending } = useCurrentUser();
  const [step, setStep] = useState(0);
  const swipe = useRef({ startX: 0, startY: 0 });
  const current = steps[step];
  useEffect(() => {
    if (user) router.replace("/recipes");
  }, [user]);

  if (isPending) return <StartupLoader />;

  const next = () =>
    step === steps.length - 1 ? router.push("/sign-in") : setStep(step + 1);
  const previous = () => setStep((value) => Math.max(0, value - 1));
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView
        style={styles.safeArea}
        onTouchStart={(event) => {
          swipe.current = {
            startX: event.nativeEvent.pageX,
            startY: event.nativeEvent.pageY,
          };
        }}
        onTouchEnd={(event) => {
          const dx = event.nativeEvent.pageX - swipe.current.startX;
          const dy = event.nativeEvent.pageY - swipe.current.startY;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            dx < 0 ? next() : previous();
          }
        }}
      >
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
            <ThemedText style={styles.stepIndex}>
              {current.index + 1} / {steps.length}
            </ThemedText>
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

function StartupLoader() {
  return (
    <ThemedView style={styles.loaderScreen}>
      <Image
        source={require("@/assets/images/yuzu-logo-transparent.png")}
        style={styles.loaderLogo}
        contentFit="contain"
        accessibilityLabel="Yuzu logo"
      />
      <ThemedText style={styles.loaderName}>Yuzu</ThemedText>
      <ActivityIndicator size="small" color={colors.leaf} />
    </ThemedView>
  );
}

function OnboardingVisual({ step }: { step: number }) {
  if (step === 0)
    return (
      <View style={styles.listPanel}>
        <ThemedText style={styles.panelEyebrow}>
          IMPORT FROM ANYWHERE
        </ThemedText>
        {["TikTok", "Instagram", "Facebook", "YouTube", "Pinterest", "Web"].map(
          (source, index) => (
            <View key={source} style={styles.listRow}>
              <View
                style={[
                  styles.sourceDot,
                  {
                    backgroundColor: [
                      "#111",
                      "#E1306C",
                      "#1877F2",
                      "#FF0000",
                      "#E60023",
                      colors.leaf,
                    ][index],
                  },
                ]}
              />
              <ThemedText style={styles.listText}>{source}</ThemedText>
              <Ionicons name="checkmark" size={17} color={colors.leaf} />
            </View>
          ),
        )}
      </View>
    );
  if (step === 1)
    return (
      <View style={styles.listPanel}>
        <ThemedText style={styles.panelEyebrow}>YOUR SHOPPING LIST</ThemedText>
        {["Avocados", "Cherry tomatoes", "Basil", "Pasta"].map(
          (item, index) => (
            <View key={item} style={styles.listRow}>
              <View style={styles.check} />
              <ThemedText style={styles.listText}>{item}</ThemedText>
              <ThemedText style={styles.quantity}>
                {["2 ripe", "1 pint", "1 bunch", "400 g"][index]}
              </ThemedText>
            </View>
          ),
        )}
      </View>
    );
  if (step === 2)
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
  loaderScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCFBF8",
    gap: 12,
  },
  loaderLogo: { width: 104, height: 104 },
  loaderName: { color: colors.ink, fontSize: 24, fontWeight: "800" },
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
  sourceDot: { width: 12, height: 12, borderRadius: 6 },
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
  stepIndex: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
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
