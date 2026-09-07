import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { IoniconsIconName } from "@react-native-vector-icons/ionicons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCurrentUser } from "@/hooks/use-auth";
import { useRecipePreferences } from "@/stores/recipe-preferences";

const colors = {
  ink: "#14231A",
  leaf: "#4E8B5B",
  sage: "#DDE8D6",
  muted: "#738078",
  line: "#D9E1D7",
  yellow: "#F8C957",
};

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  if (hour < 22) return "GOOD EVENING";
  return "GOOD NIGHT";
}

export default function Tab1Screen() {
  const folderSheetRef = useRef<BottomSheetMethods>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folder, setFolder] = useState("All folders");
  const { viewMode, setViewMode } = useRecipePreferences();
  const [folders, setFolders] = useState([
    "All folders",
    "Favorites",
    "Quick meals",
    "Vegetarian",
  ]);
  const [newFolder, setNewFolder] = useState("");
  const { width: windowWidth } = useWindowDimensions();
  const { data: user } = useCurrentUser();
  const displayName = user?.name?.trim() || "there";
  const initial = displayName.charAt(0).toUpperCase();
  const greeting = getTimeGreeting();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.greeting}>{greeting}</ThemedText>
              <ThemedText style={styles.profileName}>{displayName}</ThemedText>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{initial}</ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.banner}>
            <View style={styles.bannerTop}>
              <ThemedText style={styles.bannerEyebrow}>YUZU PRO</ThemedText>
              <ThemedText style={styles.bannerPrice}>from $8 / week</ThemedText>
            </View>
            <ThemedText style={styles.bannerTitle}>
              Upgrade to save unlimited recipes.
            </ThemedText>
            <ThemedText style={styles.bannerBody}>
              Unlimited imports · smart pantry · meal plans
            </ThemedText>
            <View style={styles.upgradeRow}>
              <Pressable
                accessibilityRole="button"
                style={styles.upgradeButton}
                onPress={() => router.push("/paywall")}
              >
                <ThemedText style={styles.upgradeLabel}>
                  Upgrade to Pro
                </ThemedText>
              </Pressable>
              <ThemedText style={styles.freeRecipes}>
                3 free recipes left
              </ThemedText>
            </View>
          </View>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <ThemedText style={styles.searchText}>
              Search saved recipes
            </ThemedText>
          </View>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose recipe folder"
              style={styles.folderSelect}
              onPress={() => folderSheetRef.current?.present()}
            >
              <Ionicons name="folder-outline" size={18} color={colors.leaf} />
              <ThemedText style={styles.folderLabel}>{folder}</ThemedText>
              <Ionicons name="chevron-down" size={17} color={colors.muted} />
            </Pressable>
            <BottomSheet
              ref={folderSheetRef}
              index={-1}
              enableDynamicSizing
              enablePanDownToClose
              backgroundStyle={styles.sheet}
            >
              <BottomSheetView
                style={[styles.sheetView, { width: windowWidth }]}
              >
                <View style={styles.dialogHeader}>
                  <ThemedText style={styles.dialogTitle}>
                    Choose a folder
                  </ThemedText>
                  <Pressable
                    accessibilityLabel="Close folder selector"
                    onPress={() => folderSheetRef.current?.close()}
                  >
                    <Ionicons name="close" size={22} color={colors.ink} />
                  </Pressable>
                </View>
                <BottomSheetScrollView
                  style={styles.folderList}
                  contentContainerStyle={styles.sheetContent}
                >
                  {folders.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.folderOption}
                      onPress={() => {
                        setFolder(option);
                        folderSheetRef.current?.close();
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.folderOptionLabel,
                          option === folder && styles.selectedFolder,
                        ]}
                      >
                        {option}
                      </ThemedText>
                      {option === folder && (
                        <Ionicons
                          name="checkmark"
                          size={17}
                          color={colors.leaf}
                        />
                      )}
                    </Pressable>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    style={styles.newFolder}
                    onPress={() => {
                      folderSheetRef.current?.close();
                      setCreateFolderOpen(true);
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.leaf} />
                    <ThemedText style={styles.newFolderLabel}>
                      New folder
                    </ThemedText>
                  </Pressable>
                </BottomSheetScrollView>
              </BottomSheetView>
            </BottomSheet>
            <Modal
              visible={createFolderOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setCreateFolderOpen(false)}
            >
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setCreateFolderOpen(false)}
              >
                <KeyboardAvoidingView
                  style={styles.keyboardAvoiding}
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  keyboardVerticalOffset={24}
                >
                  <Pressable
                    style={styles.folderDialog}
                    onPress={(event) => event.stopPropagation()}
                  >
                    <View style={styles.dialogHeader}>
                      <ThemedText style={styles.dialogTitle}>
                        New folder
                      </ThemedText>
                      <Pressable
                        accessibilityLabel="Close create folder dialog"
                        onPress={() => setCreateFolderOpen(false)}
                      >
                        <Ionicons name="close" size={22} color={colors.ink} />
                      </Pressable>
                    </View>
                    <TextInput
                      autoFocus
                      accessibilityLabel="New folder name"
                      placeholder="Folder name"
                      placeholderTextColor={colors.muted}
                      value={newFolder}
                      onChangeText={setNewFolder}
                      style={styles.addFolderInput}
                    />
                    <View style={styles.dialogActions}>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.cancelButton}
                        onPress={() => setCreateFolderOpen(false)}
                      >
                        <ThemedText style={styles.cancelLabel}>
                          Cancel
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.addFolderButton}
                        onPress={() => {
                          const name = newFolder.trim();
                          if (!name || folders.includes(name)) return;
                          setFolders([...folders, name]);
                          setFolder(name);
                          setNewFolder("");
                          setCreateFolderOpen(false);
                        }}
                      >
                        <ThemedText style={styles.addFolderLabel}>
                          Create
                        </ThemedText>
                      </Pressable>
                    </View>
                  </Pressable>
                </KeyboardAvoidingView>
              </Pressable>
            </Modal>
          </View>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Recipes</ThemedText>
            <Pressable
              accessibilityLabel={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              <Ionicons
                name={viewMode === "grid" ? "list-outline" : "grid-outline"}
                size={18}
                color={colors.leaf}
              />
            </Pressable>
          </View>
          <View style={[styles.cards, viewMode === "list" && styles.listCards]}>
            <RecipeCard
              title="Creamy lemon pasta"
              color="#F8E5A9"
              icon="nutrition-outline"
              list={viewMode === "list"}
            />
            <RecipeCard
              title="Crispy chili eggs"
              color="#F4D2C5"
              icon="leaf-outline"
              list={viewMode === "list"}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function RecipeCard({
  title,
  color,
  icon,
  list,
}: {
  title: string;
  color: string;
  icon: IoniconsIconName;
  list: boolean;
}) {
  return (
    <View style={[styles.card, list && styles.listCard]}>
      <View
        style={[
          styles.cardImage,
          list && styles.listCardImage,
          { backgroundColor: color },
        ]}
      >
        <Ionicons name={icon} size={38} color={colors.ink} />
      </View>
      <View style={styles.cardInfo}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText style={styles.cardMeta}>20 min · Easy</ThemedText>
      </View>
      {list && (
        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color={colors.muted}
          style={styles.cardMore}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFBF8" },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 28 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    color: colors.leaf,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 0,
  },
  profileName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 1,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 3 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  search: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
  },
  searchText: { color: colors.muted, fontSize: 16 },
  folderSelect: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
  },
  folderLabel: { color: colors.ink, fontSize: 15, fontWeight: "700", flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#14231A66",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  keyboardAvoiding: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    backgroundColor: "#FCFBF8",
    borderWidth: 2,
    borderColor: "#000000",
    width: "100%",
  },
  sheetView: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    padding: 20,
    gap: 8,
  },
  folderList: { width: "100%", maxHeight: 360 },
  sheetContent: { gap: 8, width: "100%" },
  folderDialog: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: "#FCFBF8",
    padding: 18,
    gap: 12,
  },
  dialogHeader: {
    width: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dialogTitle: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  folderOption: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFFFF",
  },
  folderOptionLabel: { color: colors.ink, fontSize: 15 },
  selectedFolder: { color: colors.leaf, fontWeight: "800" },
  newFolder: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  newFolderLabel: { color: colors.leaf, fontSize: 15, fontWeight: "800" },
  addFolderInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  cancelButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  cancelLabel: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  addFolderButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.leaf,
  },
  addFolderLabel: { color: "#fff", fontSize: 15, fontWeight: "800" },
  banner: {
    minHeight: 156,
    borderRadius: 17,
    backgroundColor: colors.ink,
    padding: 16,
    gap: 6,
  },
  bannerTop: { flexDirection: "row", justifyContent: "space-between" },
  bannerEyebrow: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bannerPrice: { color: "#fff", fontSize: 14 },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  bannerBody: { color: "#B6C2B9", fontSize: 14 },
  upgradeButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 3,
  },
  upgradeLabel: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 3,
  },
  freeRecipes: { color: "#B6C2B9", fontSize: 13, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: "800" },
  viewToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  cards: { flexDirection: "row", gap: 12 },
  listCards: { flexDirection: "column", gap: 10 },
  card: {
    flex: 1,
    minHeight: 190,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  cardImage: { height: 112, alignItems: "center", justifyContent: "center" },
  listCard: {
    width: "100%",
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
  },
  listCardImage: { width: 54, height: 54, borderRadius: 14 },
  cardInfo: { flex: 1 },
  cardMore: { marginRight: 2 },
  cardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    paddingHorizontal: 9,
    marginTop: 8,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 13,
    paddingHorizontal: 9,
    marginTop: 3,
  },
});
