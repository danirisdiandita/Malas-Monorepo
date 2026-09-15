import { router } from "expo-router";
import * as StoreReview from "expo-store-review";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UpgradeSubscriptionSheet } from "@/components/upgrade-subscription-sheet";
import { useCurrentUser } from "@/hooks/use-auth";
import { deleteAccount, signOut } from "@/lib/api";
import { Ionicons } from "@react-native-vector-icons/ionicons";

const colors = {
  ink: "#14231A",
  leaf: "#4E8B5B",
  sage: "#DDE8D6",
  muted: "#738078",
  line: "#D9E1D7",
};
const profileOptions = [
  ["star-outline", "Rate & Feedback"],
  ["help-circle-outline", "Help & Support"],
  ["lock-closed-outline", "Privacy Policy"],
  ["document-text-outline", "Terms of Service"],
];

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const upgradeSheetRef = useRef<BottomSheetMethods>(null);
  const { data: user } = useCurrentUser();
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [openingSupport, setOpeningSupport] = useState(false);
  const handleRateAndFeedback = async () => {
    if (reviewing) return;
    setReviewing(true);
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      } else {
        Alert.alert("Rate & Feedback", "Store reviews are not available on this device.");
      }
    } catch {
      Alert.alert("Rate & Feedback", "Unable to open the store review prompt.");
    } finally {
      setReviewing(false);
    }
  };
  const handleSupport = async () => {
    if (openingSupport) return;
    setOpeningSupport(true);
    try {
      await Linking.openURL("mailto:dani@danirisdiandita.com?subject=Yuzu%20support");
    } catch {
      Alert.alert("Help & Support", "Unable to open your email app.");
    } finally {
      setOpeningSupport(false);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace("/sign-in");
    } catch {
      Alert.alert("Sign out failed", "Please try again.");
    }
  };
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE" || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      queryClient.clear();
      router.replace("/sign-in");
    } catch (error) {
      setDeleting(false);
      Alert.alert(
        "Could not delete account",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.userName}>
            {user?.name || "Your profile"}
          </ThemedText>
          <View style={styles.proCard}>
            <View style={styles.proTop}>
              <ThemedText style={styles.proEyebrow}>YUZU PRO</ThemedText>
              <ThemedText style={styles.proPrice}>from $8 / week</ThemedText>
            </View>
            <ThemedText style={styles.proTitle}>
              Cook without limits.
            </ThemedText>
            <ThemedText style={styles.proMeta}>
              Unlimited imports · smart grocery lists · meal plans
            </ThemedText>
            <Pressable
              style={styles.upgrade}
              onPress={() => upgradeSheetRef.current?.present()}
            >
              <ThemedText style={styles.upgradeText}>Upgrade to Pro</ThemedText>
            </Pressable>
          </View>
          <View style={styles.options}>
            {profileOptions.map(([icon, label]) => (
              <Pressable
                key={label}
                disabled={(label === "Rate & Feedback" && reviewing) || (label === "Help & Support" && openingSupport)}
                style={styles.option}
                onPress={() =>
                  label === "Rate & Feedback"
                    ? void handleRateAndFeedback()
                    : label === "Help & Support"
                      ? void handleSupport()
                    : label === "Terms of Service"
                    ? setTermsOpen(true)
                    : label === "Privacy Policy"
                      ? setPrivacyOpen(true)
                      : Alert.alert(
                          label,
                          "This section is ready for local configuration.",
                        )
                }
              >
                <Ionicons name={icon as never} size={19} color={colors.leaf} />
                <ThemedText style={styles.optionLabel}>{label}</ThemedText>
                {(label === "Rate & Feedback" && reviewing) || (label === "Help & Support" && openingSupport) ? (
                  <ActivityIndicator size="small" color={colors.leaf} />
                ) : (
                  <Ionicons name="chevron-forward" size={15} color={colors.muted} />
                )}
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.signOut} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={19} color="#fff" />
            <ThemedText style={styles.signOutText}>Sign out</ThemedText>
          </Pressable>
          <ThemedText style={styles.version}>yuzu v1.0.0</ThemedText>
          <View style={styles.dangerDivider} />
          <ThemedText style={styles.dangerSection}>DANGER ZONE</ThemedText>
          <Pressable
            style={styles.deleteAccount}
            onPress={() => setDeleteOpen(true)}
          >
            <Ionicons name="trash-outline" size={18} color="#D92D20" />
            <ThemedText style={styles.deleteAccountText}>
              DELETE ACCOUNT
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <UpgradeSubscriptionSheet sheetRef={upgradeSheetRef} />
      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteOpen(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteIcon}>
              <Ionicons name="warning-outline" size={24} color="#D92D20" />
            </View>
            <ThemedText style={styles.deleteTitle}>
              Delete your account?
            </ThemedText>
            <ThemedText style={styles.deleteBody}>
              This permanently removes your recipes, folders, groceries, plans,
              and account data.
            </ThemedText>
            <ThemedText style={styles.deleteInstruction}>
              Type DELETE to confirm.
            </ThemedText>
            <TextInput
              autoCapitalize="characters"
              editable={!deleting}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder="DELETE"
              placeholderTextColor={colors.muted}
              style={styles.deleteInput}
            />
            <View style={styles.deleteActions}>
              <Pressable
                disabled={deleting}
                style={styles.deleteCancel}
                onPress={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmation("");
                }}
              >
                <ThemedText style={styles.deleteCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                disabled={deleteConfirmation !== "DELETE" || deleting}
                style={[
                  styles.deleteConfirm,
                  (deleteConfirmation !== "DELETE" || deleting) &&
                    styles.deleteConfirmDisabled,
                ]}
                onPress={handleDeleteAccount}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.deleteConfirmText}>
                    Delete permanently
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={termsOpen}
        animationType="slide"
        onRequestClose={() => setTermsOpen(false)}
      >
        <ThemedView style={styles.termsScreen}>
          <SafeAreaView style={styles.termsSafeArea}>
            <View style={styles.termsHeader}>
              <ThemedText style={styles.termsTitle}>
                Terms of Service
              </ThemedText>
              <Pressable
                accessibilityLabel="Close Terms of Service"
                style={styles.termsClose}
                onPress={() => setTermsOpen(false)}
              >
                <Ionicons name="close" size={22} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.termsContent}>
              <ThemedText style={styles.termsUpdated}>
                Last updated: September 13, 2026
              </ThemedText>
              <ThemedText style={styles.termsIntro}>
                These Terms of Service govern your use of Yuzu. By creating an
                account or using Yuzu, you agree to these Terms.
              </ThemedText>
              <TermsSection
                title="1. Using Yuzu"
                text="Yuzu helps you save, organize, plan, and use recipes. You must provide accurate account information, keep your sign-in details secure, and use the service only as permitted by law."
              />
              <TermsSection
                title="2. Recipe imports"
                text="When you submit a recipe or social link, Yuzu may retrieve and process publicly available text, images, video, captions, subtitles, and other metadata from that source. Imported content may be incomplete or inaccurate. Review recipes, ingredients, allergens, quantities, and cooking instructions before relying on them."
              />
              <TermsSection
                title="3. Your content"
                text="You retain responsibility for content and links you submit. You confirm that you have the right to submit them and that doing so does not violate another person's rights or a platform's terms. You grant Yuzu permission to store and process submitted content as needed to provide and improve the service."
              />
              <TermsSection
                title="4. Acceptable use"
                text="Do not misuse Yuzu, interfere with its operation, attempt unauthorized access, upload unlawful or harmful content, scrape the service, or use imported recipes in a way that violates applicable law or third-party rights."
              />
              <TermsSection
                title="5. Pro features"
                text="Some features may require a paid subscription or may change over time. Pricing, billing periods, renewals, cancellations, and refunds are governed by the store or payment provider through which you subscribe."
              />
              <TermsSection
                title="6. Deletion and suspension"
                text="You may stop using Yuzu at any time. We may suspend or terminate access if you breach these Terms, create risk for other users, or use the service unlawfully. Deleting an account may permanently remove its recipes, folders, groceries, and related data, subject to legal or operational retention requirements."
              />
              <TermsSection
                title="7. Disclaimers"
                text="Yuzu is provided on an as-is and as-available basis. We do not guarantee uninterrupted service or that imported content is complete, correct, safe, or suitable for your dietary needs. Yuzu is not medical, nutritional, allergy, or professional cooking advice. You are responsible for checking ingredients, allergens, food safety, and local requirements."
              />
              <TermsSection
                title="8. Changes"
                text="We may update these Terms when the service changes. We will make the updated version available in Yuzu and revise the date above. Continuing to use Yuzu after an update means you accept the revised Terms."
              />
              <TermsSection
                title="9. Contact"
                text="For questions about these Terms, contact us through the Help & Support option in Yuzu."
              />
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
      <Modal
        visible={privacyOpen}
        animationType="slide"
        onRequestClose={() => setPrivacyOpen(false)}
      >
        <ThemedView style={styles.termsScreen}>
          <SafeAreaView style={styles.termsSafeArea}>
            <View style={styles.termsHeader}>
              <ThemedText style={styles.termsTitle}>Privacy Policy</ThemedText>
              <Pressable
                accessibilityLabel="Close Privacy Policy"
                style={styles.termsClose}
                onPress={() => setPrivacyOpen(false)}
              >
                <Ionicons name="close" size={22} color={colors.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.termsContent}>
              <ThemedText style={styles.termsUpdated}>
                Last updated: September 13, 2026
              </ThemedText>
              <ThemedText style={styles.termsIntro}>
                This Privacy Policy explains how Yuzu collects, uses, stores,
                and protects information when you use the app.
              </ThemedText>
              <TermsSection
                title="1. Information we collect"
                text="We collect account details you provide, such as your name, email address, profile picture, and sign-in provider information. We also collect recipes, folders, groceries, meal plans, links, ratings, and other content you save or submit."
              />
              <TermsSection
                title="2. Imported content"
                text="When you import a link, we process information available from the source, which may include recipe text, captions, images, video, subtitles, metadata, and the original URL. We use this information to create and display your recipe and related content."
              />
              <TermsSection
                title="3. How we use information"
                text="We use information to provide, secure, maintain, and improve Yuzu; authenticate your account; process imports; sync your saved content; respond to support requests; and investigate errors or misuse."
              />
              <TermsSection
                title="4. Sharing"
                text="We may share information with service providers that help us host data, authenticate users, store files, process imports, and provide the app. We do not sell your personal information. We may disclose information when required by law or needed to protect users, the service, or our rights."
              />
              <TermsSection
                title="5. Storage and retention"
                text="Your account data is stored while your account is active. We retain information only as long as reasonably necessary for the purposes described here, legal obligations, dispute resolution, security, and reliable service operation. Deletion requests may not remove information that must be retained by law."
              />
              <TermsSection
                title="6. Your choices"
                text="You can review or update supported account content in Yuzu and request deletion through Help & Support. You can also stop using the service or revoke a connected sign-in provider's access, although some account features may no longer work."
              />
              <TermsSection
                title="7. Security"
                text="We use reasonable technical and organizational safeguards to protect information. No internet transmission or storage system is completely secure, so we cannot guarantee absolute security."
              />
              <TermsSection
                title="8. Children"
                text="Yuzu is not directed to children who are below the minimum age required to use online services in their location. If you believe a child provided personal information, contact us through Help & Support."
              />
              <TermsSection
                title="9. Changes and contact"
                text="We may update this policy as Yuzu changes. The updated version will be available in the app with a revised date. For privacy questions or requests, contact us through Help & Support."
              />
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

function TermsSection({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.termsSection}>
      <ThemedText style={styles.termsSectionTitle}>{title}</ThemedText>
      <ThemedText style={styles.termsBody}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFBF8" },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 30 },
  userName: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  proCard: {
    backgroundColor: colors.ink,
    borderRadius: 17,
    padding: 16,
    gap: 6,
  },
  proTop: { flexDirection: "row", justifyContent: "space-between" },
  proEyebrow: {
    color: "#F8C957",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  proPrice: { color: "#fff", fontSize: 14 },
  proTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  proMeta: { color: "#B6C2B9", fontSize: 14 },
  upgrade: {
    alignSelf: "flex-start",
    backgroundColor: "#F8C957",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 3,
  },
  upgradeText: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  options: { backgroundColor: "#fff", borderRadius: 13, paddingHorizontal: 12 },
  option: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionLabel: { color: colors.ink, fontSize: 16, fontWeight: "700", flex: 1 },
  signOut: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.ink,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signOutText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  version: { color: colors.muted, fontSize: 12 },
  dangerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E4BDBA",
    marginTop: 8,
  },
  dangerSection: {
    color: "#D92D20",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 1,
  },
  deleteAccount: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDA29B",
    backgroundColor: "#FEF3F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteAccountText: { color: "#D92D20", fontSize: 15, fontWeight: "900" },
  deleteOverlay: {
    flex: 1,
    backgroundColor: "#14231A99",
    justifyContent: "center",
    padding: 20,
  },
  deleteModal: {
    backgroundColor: "#FCFBF8",
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  deleteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FDE7E5",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteTitle: { color: colors.ink, fontSize: 23, fontWeight: "900" },
  deleteBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  deleteInstruction: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  deleteInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#FDA29B",
    borderRadius: 13,
    paddingHorizontal: 14,
    color: colors.ink,
    backgroundColor: "#fff",
    fontWeight: "800",
    letterSpacing: 1,
  },
  deleteActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  deleteCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCancelText: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  deleteConfirm: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#D92D20",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  deleteConfirmDisabled: { backgroundColor: "#D8A19D" },
  deleteConfirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  termsScreen: { flex: 1, backgroundColor: "#FCFBF8" },
  termsSafeArea: { flex: 1 },
  termsHeader: {
    minHeight: 64,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  termsTitle: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  termsClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  termsContent: { padding: 20, gap: 18, paddingBottom: 36 },
  termsUpdated: { color: colors.muted, fontSize: 12 },
  termsIntro: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  termsSection: { gap: 6 },
  termsSectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  termsBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});
