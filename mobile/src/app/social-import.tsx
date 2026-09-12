import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const colors = {
  ink: "#14231A",
  leaf: "#4E8755",
  sage: "#E1EEDC",
  muted: "#68736B",
  line: "#D9E1D7",
  tomato: "#E87955",
  paper: "#FCFBF8",
};
const platforms = [
  ["logo-tiktok", "TikTok"],
  ["logo-facebook", "Facebook"],
  ["logo-youtube", "YouTube"],
  ["logo-instagram", "Instagram"],
  ["logo-pinterest", "Pinterest"],
] as const;

export default function SocialImportScreen() {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back to add recipe"
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>
              Import from social
            </ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hero}>
            <ThemedText style={styles.eyebrow}>SAVE THE GOOD STUFF</ThemedText>
            <ThemedText style={styles.title}>
              Bring a recipe from your feed
            </ThemedText>
            <ThemedText style={styles.description}>
              Found something delicious while scrolling? Send the link to Yuzu
              and we’ll turn it into a recipe you can actually cook.
            </ThemedText>
          </View>

          <View style={styles.platformSlab}>
            <ThemedText style={styles.platformTitle}>
              Import from your favorite platforms
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.platforms}
            >
              {platforms.map(([icon, label]) => (
                <View key={label} style={styles.platform}>
                  <View style={styles.platformIcon}>
                    <Ionicons
                      name={icon as never}
                      size={22}
                      color={colors.ink}
                    />
                  </View>
                  <ThemedText style={styles.platformLabel}>{label}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.rules}>
            <Rule
              icon="share-social-outline"
              title="Share it straight to Yuzu"
              body="Tap Share on TikTok, Instagram, or another social app, then choose Yuzu."
            />
            <View style={styles.separator}>
              <View style={styles.connector} />
              <ThemedText style={styles.or}>Or</ThemedText>
              <View style={styles.connector} />
            </View>
            <Rule
              icon="link-outline"
              title="paste the recipe link"
              body="Copy the post link, return to Yuzu, and paste it into the recipe link field."
            />
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => router.replace("/add")}
          >
            <Ionicons name="link-outline" size={19} color="#fff" />
            <ThemedText style={styles.primaryLabel}>
              Paste a recipe link
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Rule({
  icon,
  title,
  body,
}: {
  icon: "share-social-outline" | "link-outline";
  title: string;
  body: string;
}) {
  return (
    <View style={styles.rule}>
      <View style={styles.ruleIcon}>
        <Ionicons name={icon} size={22} color={colors.leaf} />
      </View>
      <View style={styles.ruleCopy}>
        <ThemedText style={styles.ruleTitle}>{title}</ThemedText>
        <ThemedText style={styles.ruleBody}>{body}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage,
  },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  headerSpacer: { width: 44 },
  hero: { alignItems: "center", paddingTop: 22, paddingBottom: 22 },
  eyebrow: {
    color: colors.tomato,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 340,
  },
  platformSlab: {
    backgroundColor: colors.sage,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  platformTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  platforms: {
    width: "100%",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  platform: { alignItems: "center", gap: 4, minWidth: 48 },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  platformLabel: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  rules: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 16,
  },
  rule: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ruleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleCopy: { flex: 1, paddingTop: 1 },
  ruleTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  ruleBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 5,
    marginLeft: 19,
  },
  connector: { height: 1, flex: 1, backgroundColor: colors.line },
  or: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  primaryButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  primaryLabel: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
