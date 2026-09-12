import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { IoniconsIconName } from "@react-native-vector-icons/ionicons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { RecipeImage } from "@/components/recipe-image";
import { ThemedView } from "@/components/themed-view";
import { useCurrentUser } from "@/hooks/use-auth";
import { useRecipes } from "@/hooks/use-recipes";
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
  const [search, setSearch] = useState("");
  const { recipes, isPending: recipesPending, error: recipesError, fetchNextPage, hasNextPage: hasMore, isFetchingNextPage } = useRecipes(search);
  const displayName = user?.name?.trim() || "there";
  const initial = displayName.charAt(0).toUpperCase();
  const greeting = getTimeGreeting();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <FlashList
          key={viewMode}
          data={recipes}
          numColumns={viewMode === "grid" ? 2 : 1}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: viewMode === "list" ? 10 : 12 }} />
          )}
          ListHeaderComponent={<View style={styles.listHeader}>
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
              <ThemedText style={styles.bannerEyebrow}>
                Unlock Unlimited Recipes
              </ThemedText>
              <ThemedText style={styles.bannerPrice}>from $8 / week</ThemedText>
            </View>
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
            <TextInput
              accessibilityLabel="Search saved recipes"
              placeholder="Search saved recipes"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              returnKeyType="search"
            />
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
          </View>}
          renderItem={({ item, index }) => (
            <RecipeCard
              imageURL={item.image_url}
              title={item.name}
              color={index % 2 === 0 ? "#F8E5A9" : "#F4D2C5"}
              icon={index % 2 === 0 ? "nutrition-outline" : "leaf-outline"}
              list={viewMode === "list"}
              meta={[item.process_minutes > 0 ? `${item.process_minutes} min` : '', item.difficulty, item.servings > 0 ? `${item.servings} servings` : ''].filter(Boolean).join(' · ')}
              onPress={() => router.push(`/recipe/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            recipesPending ? (
              <ThemedText style={styles.statusText}>Loading recipes...</ThemedText>
            ) : recipesError ? (
              <ThemedText style={styles.statusText}>Unable to load recipes.</ThemedText>
            ) : search.trim() ? (
              <ThemedText style={styles.statusText}>No recipes found.</ThemedText>
            ) : (
              <EmptyRecipes />
            )
          }
          onEndReached={() => {
            if (hasMore && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ThemedText style={styles.statusText}>Loading more...</ThemedText> : null}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function EmptyRecipes() {
  return (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyEyebrow}>YOUR KITCHEN STARTS HERE</ThemedText>
      <ThemedText style={styles.emptyTitle}>Save your first recipe</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        Keep every recipe you love in one calm, organized place — ready whenever you want to cook.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        style={styles.emptyPrimary}
        onPress={() => router.push("/add-recipe")}
      >
        <Ionicons name="add" size={19} color="#FFFFFF" />
        <ThemedText style={styles.emptyPrimaryLabel}>Add your first recipe</ThemedText>
      </Pressable>
      <View style={styles.quickOptions}>
        {[
          ["link-outline", "Paste link"],
          ["camera-outline", "Take photo"],
          ["sparkles-outline", "Ask AI"],
        ].map(([icon, label]) => (
          <View key={label} style={styles.quickOption}>
            <View style={styles.quickIcon}>
              <Ionicons name={icon as IoniconsIconName} size={16} color={colors.leaf} />
            </View>
            <ThemedText style={styles.quickLabel}>{label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function RecipeCard({
  imageURL,
  title,
  color,
  icon,
  list,
  meta,
  onPress,
}: {
  imageURL?: string;
  title: string;
  color: string;
  icon: IoniconsIconName;
  list: boolean;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open recipe ${title}`} onPress={onPress} style={[styles.card, list ? styles.listCard : styles.gridCard]}>
      <View
        style={[
          styles.cardImage,
          list && styles.listCardImage,
          { backgroundColor: color },
        ]}
      >
        <Ionicons name={icon} size={38} color={colors.ink} />
        <RecipeImage url={imageURL} />
      </View>
      <View style={styles.cardInfo}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText style={styles.cardMeta}>{meta}</ThemedText>
      </View>
      {list && (
        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color={colors.muted}
          style={styles.cardMore}
        />
      )}
    </Pressable>
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
  searchInput: { flex: 1, color: colors.ink, fontSize: 16, paddingVertical: 0 },
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
    minHeight: 78,
    borderRadius: 17,
    backgroundColor: colors.ink,
    padding: 11,
    gap: 5,
  },
  bannerTop: { flexDirection: "row", justifyContent: "space-between" },
  bannerEyebrow: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bannerPrice: { color: "#fff", fontSize: 14 },
  upgradeButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 1,
  },
  upgradeLabel: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
  },
  freeRecipes: { color: "#B6C2B9", fontSize: 11, fontWeight: "700" },
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
  listHeader: { gap: 16 },
  card: {
    flex: 1,
    minHeight: 190,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  gridCard: { marginHorizontal: 6 },
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
  statusText: { color: colors.muted, fontSize: 15, textAlign: "center", paddingVertical: 24 },
  emptyState: {
    minHeight: 300,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    padding: 24,
    gap: 14,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  emptyEyebrow: { color: "#EA7450", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  emptyTitle: { color: colors.ink, fontSize: 25, fontWeight: "800", textAlign: "center" },
  emptyDescription: { color: "#68736B", fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyPrimary: {
    width: "100%",
    height: 50,
    borderRadius: 17,
    backgroundColor: colors.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    shadowColor: colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyPrimaryLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  quickOptions: { flexDirection: "row", gap: 16, alignItems: "center", marginTop: 2 },
  quickOption: { alignItems: "center", gap: 5 },
  quickIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#F5F7F1", alignItems: "center", justifyContent: "center" },
  quickLabel: { color: "#68736B", fontSize: 10, fontWeight: "800" },
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
