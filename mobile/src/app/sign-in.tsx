import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthProviderButton } from "@/components/auth-provider-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCurrentUser } from "@/hooks/use-auth";

const colors = {
  ink: "#14231A",
  leaf: "#2F6B3E",
  sage: "#DDE8D6",
  muted: "#738078",
};

export default function SignInScreen() {
  const { data: user } = useCurrentUser();
  const showOnboardingBack = process.env.EXPO_PUBLIC_ENV !== "production";
  const [legalDocument, setLegalDocument] = useState<
    "terms" | "privacy" | null
  >(null);

  useEffect(() => {
    if (user) router.replace("/recipes");
  }, [user]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {showOnboardingBack && (
          <Pressable onPress={() => router.replace("/")} hitSlop={12}>
            <ThemedText style={styles.back}>‹ Back to onboarding</ThemedText>
          </Pressable>
        )}
        <View style={styles.content}>
          <ThemedText style={styles.brand}>YUZU</ThemedText>
          <ThemedText style={styles.title}>
            Keep your kitchen in sync.
          </ThemedText>
          <ThemedText style={styles.description}>
            Sign in to keep every saved recipe, grocery list, and meal plan safe
            on every device.
          </ThemedText>
          <View style={styles.syncCard}>
            <Image
              source={require("@/assets/images/yuzu-logo-transparent.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Yuzu logo"
            />
            <ThemedText style={styles.syncCaption}>
              RECIPES · LISTS · PLANS
            </ThemedText>
          </View>
        </View>
        <View style={styles.authArea}>
          <View style={styles.providers}>
            <AuthProviderButton provider="google" />
            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <ThemedText style={styles.orLabel}>or</ThemedText>
              <View style={styles.orLine} />
            </View>
            <AuthProviderButton provider="apple" />
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.legalLinks}>
            <ThemedText style={styles.terms}>
              By continuing, you agree to our{" "}
            </ThemedText>
            <Pressable onPress={() => setLegalDocument("terms")}>
              <ThemedText style={styles.legalLink}>Terms</ThemedText>
            </Pressable>
            <ThemedText style={styles.terms}> and </ThemedText>
            <Pressable onPress={() => setLegalDocument("privacy")}>
              <ThemedText style={styles.legalLink}>Privacy Policy</ThemedText>
            </Pressable>
            <ThemedText style={styles.terms}>.</ThemedText>
          </View>
        </View>
      </SafeAreaView>
      <LegalModal
        document={legalDocument}
        onClose={() => setLegalDocument(null)}
      />
    </ThemedView>
  );
}

function LegalModal({
  document,
  onClose,
}: {
  document: "terms" | "privacy" | null;
  onClose: () => void;
}) {
  const isTerms = document === "terms";
  return (
    <Modal
      visible={document !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.legalScreen}>
        <SafeAreaView style={styles.legalSafeArea}>
          <View style={styles.legalHeader}>
            <ThemedText style={styles.legalTitle}>
              {isTerms ? "Terms of Service" : "Privacy Policy"}
            </ThemedText>
            <Pressable
              accessibilityLabel={`Close ${isTerms ? "Terms of Service" : "Privacy Policy"}`}
              style={styles.legalClose}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.legalContent}>
            <ThemedText style={styles.legalUpdated}>
              Last updated: September 13, 2026
            </ThemedText>
            {isTerms ? (
              <>
                <ThemedText style={styles.legalIntro}>
                  By creating an account or using Yuzu, you agree to these Terms
                  of Service.
                </ThemedText>
                <LegalSection
                  title="Using Yuzu"
                  text="Yuzu helps you save, organize, plan, and use recipes. Keep your account information secure and use the service lawfully."
                />
                <LegalSection
                  title="Recipe imports"
                  text="Yuzu may process publicly available text, images, video, captions, subtitles, and metadata from links you submit. Imported recipes may be incomplete or inaccurate; review ingredients, allergens, quantities, and instructions before cooking."
                />
                <LegalSection
                  title="Your content"
                  text="You are responsible for content and links you submit and confirm that you have the right to use them. You allow Yuzu to store and process them to provide the service."
                />
                <LegalSection
                  title="Disclaimers"
                  text="Yuzu is not medical, nutritional, allergy, or professional cooking advice. Check ingredients, allergens, food safety, and local requirements yourself."
                />
              </>
            ) : (
              <>
                <ThemedText style={styles.legalIntro}>
                  This Privacy Policy explains how Yuzu collects, uses, stores,
                  and protects information.
                </ThemedText>
                <LegalSection
                  title="Information we collect"
                  text="We collect account details such as your name, email address, profile picture, and sign-in provider information, plus recipes, folders, groceries, meal plans, links, ratings, and other content you save or submit."
                />
                <LegalSection
                  title="How we use information"
                  text="We use information to provide, secure, maintain, and improve Yuzu; authenticate accounts; process imports; sync saved content; provide support; and investigate errors or misuse."
                />
                <LegalSection
                  title="Sharing and storage"
                  text="Service providers may process information to host data, authenticate users, store files, process imports, and provide the app. We do not sell personal information. Account data is retained while your account is active and as reasonably necessary for legal, security, and operational purposes."
                />
                <LegalSection
                  title="Your choices and security"
                  text="You can update supported content in Yuzu and request deletion through Help & Support. We use reasonable safeguards, but no internet transmission or storage system is completely secure."
                />
              </>
            )}
            <LegalSection
              title="Changes and contact"
              text="We may update this document as Yuzu changes. The updated version will be available in the app with a revised date. Contact us through Help & Support with questions or requests."
            />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

function LegalSection({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.legalSection}>
      <ThemedText style={styles.legalSectionTitle}>{title}</ThemedText>
      <ThemedText style={styles.legalBody}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFBF8" },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  back: { color: colors.muted, fontSize: 16 },
  content: { flex: 1, alignItems: "center", paddingTop: 36 },
  brand: {
    color: colors.leaf,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 18,
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    lineHeight: 39,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.7,
  },
  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 330,
    marginTop: 14,
  },
  syncCard: {
    width: 220,
    // height: 160,
    borderRadius: 26,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  logo: { width: 82, height: 82, marginBottom: 8, alignSelf: "center" },
  syncIcon: {
    color: colors.leaf,
    fontSize: 64,
    lineHeight: 70,
    fontWeight: "700",
  },
  syncCaption: {
    color: colors.leaf,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },
  authArea: { width: "100%", paddingTop: 12 },
  continueLabel: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  providers: { width: "100%", gap: 10 },
  orDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: "#D9E1D7" },
  orLabel: { color: colors.muted, fontSize: 12 },
  footer: { alignItems: "center", gap: 12, paddingTop: 12 },
  legalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  terms: { color: colors.muted, fontSize: 12, textAlign: "center" },
  legalLink: { color: colors.leaf, fontSize: 12, fontWeight: "800" },
  skip: { color: colors.leaf, fontSize: 16, fontWeight: "800" },
  legalScreen: { flex: 1, backgroundColor: "#FCFBF8" },
  legalSafeArea: { flex: 1 },
  legalHeader: {
    minHeight: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.sage,
  },
  legalTitle: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  legalClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  legalContent: { padding: 20, gap: 18, paddingBottom: 36 },
  legalUpdated: { color: colors.muted, fontSize: 12 },
  legalIntro: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  legalSection: { gap: 6 },
  legalSectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  legalBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});
