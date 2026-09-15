import { Ionicons } from "@react-native-vector-icons/ionicons";
import BottomSheet, {
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCreateFolder, useFolders } from "@/hooks/use-folders";
import { useImportLink } from "@/hooks/use-import-link";

const colors = {
  ink: "#14231A",
  leaf: "#2F6B3E",
  sage: "#DDE8D6",
  muted: "#738078",
  line: "#D9E1D7",
  tomato: "#E87955",
  paper: "#FCFBF8",
};
const languages = [
  { key: "", label: "Auto", flag: "✨" },
  { key: "en", label: "English", flag: "🇬🇧🇺🇸" },
  { key: "zh", label: "Chinese", flag: "🇨🇳" },
  { key: "de", label: "German", flag: "🇩🇪" },
  { key: "es", label: "Spanish", flag: "🇪🇸" },
  { key: "ru", label: "Russian", flag: "🇷🇺" },
  { key: "ko", label: "Korean", flag: "🇰🇷" },
  { key: "fr", label: "French", flag: "🇫🇷" },
  { key: "ja", label: "Japanese", flag: "🇯🇵" },
  { key: "pt", label: "Portuguese", flag: "🇵🇹" },
  { key: "tr", label: "Turkish", flag: "🇹🇷" },
  { key: "pl", label: "Polish", flag: "🇵🇱" },
  { key: "ca", label: "Catalan", flag: "🇨🇦" },
  { key: "nl", label: "Dutch", flag: "🇳🇱" },
  { key: "ar", label: "Arabic", flag: "🇦🇪" },
  { key: "sv", label: "Swedish", flag: "🇸🇪" },
  { key: "it", label: "Italian", flag: "🇮🇹" },
  { key: "id", label: "Indonesian", flag: "🇮🇩" },
  { key: "hi", label: "Hindi", flag: "🇮🇳" },
  { key: "fi", label: "Finnish", flag: "🇫🇮" },
  { key: "vi", label: "Vietnamese", flag: "🇻🇳" },
  { key: "he", label: "Hebrew", flag: "🇮🇱" },
  { key: "uk", label: "Ukrainian", flag: "🇺🇦" },
  { key: "el", label: "Greek", flag: "🇬🇷" },
  { key: "ms", label: "Malay", flag: "🇲🇾" },
  { key: "cs", label: "Czech", flag: "🇨🇿" },
  { key: "ro", label: "Romanian", flag: "🇷🇴" },
  { key: "da", label: "Danish", flag: "🇩🇰" },
  { key: "hu", label: "Hungarian", flag: "🇭🇺" },
  { key: "ta", label: "Tamil", flag: "🇮🇳" },
  { key: "no", label: "Norwegian", flag: "🇳🇴" },
  { key: "th", label: "Thai", flag: "🇹🇭" },
  { key: "ur", label: "Urdu", flag: "🇵🇰" },
  { key: "hr", label: "Croatian", flag: "🇭🇷" },
  { key: "bg", label: "Bulgarian", flag: "🇧🇬" },
  { key: "lt", label: "Lithuanian", flag: "🇱🇹" },
  { key: "la", label: "Latin", flag: "🇻🇦" },
  { key: "mi", label: "Maori", flag: "🇳🇿" },
  { key: "ml", label: "Malayalam", flag: "🇮🇳" },
  { key: "cy", label: "Welsh", flag: "🇬🇧" },
  { key: "sk", label: "Slovak", flag: "🇸🇰" },
  { key: "te", label: "Telugu", flag: "🇮🇳" },
  { key: "fa", label: "Persian", flag: "🇮🇷" },
  { key: "lv", label: "Latvian", flag: "🇱🇻" },
  { key: "bn", label: "Bengali", flag: "🇧🇩" },
  { key: "sr", label: "Serbian", flag: "🇷🇸" },
  { key: "az", label: "Azerbaijani", flag: "🇦🇿" },
  { key: "sl", label: "Slovenian", flag: "🇸🇮" },
  { key: "kn", label: "Kannada", flag: "🇮🇳" },
  { key: "et", label: "Estonian", flag: "🇪🇪" },
  { key: "mk", label: "Macedonian", flag: "🇲🇰" },
  { key: "br", label: "Breton", flag: "🇫🇷" },
  { key: "eu", label: "Basque", flag: "🇪🇸" },
  { key: "is", label: "Icelandic", flag: "🇮🇸" },
  { key: "hy", label: "Armenian", flag: "🇦🇲" },
  { key: "ne", label: "Nepali", flag: "🇳🇵" },
  { key: "mn", label: "Mongolian", flag: "🇲🇳" },
  { key: "bs", label: "Bosnian", flag: "🇧🇦" },
  { key: "kk", label: "Kazakh", flag: "🇰🇿" },
  { key: "sq", label: "Albanian", flag: "🇦🇱" },
  { key: "sw", label: "Swahili", flag: "🇹🇿" },
  { key: "gl", label: "Galician", flag: "🇬🇱" },
  { key: "mr", label: "Marathi", flag: "🇮🇳" },
  { key: "pa", label: "Punjabi", flag: "🇵🇰" },
  { key: "si", label: "Sinhala", flag: "🇱🇰" },
  { key: "km", label: "Khmer", flag: "🇰🇭" },
  { key: "sn", label: "Shona", flag: "🇿🇼" },
  { key: "yo", label: "Yoruba", flag: "🇳🇬" },
  { key: "so", label: "Somali", flag: "🇸🇴" },
  { key: "af", label: "Afrikaans", flag: "🇿🇦" },
  { key: "oc", label: "Occitan", flag: "🇫🇷" },
  { key: "ka", label: "Georgian", flag: "🇬🇪" },
  { key: "be", label: "Belarusian", flag: "🇧🇾" },
  { key: "tg", label: "Tajik", flag: "🇹🇯" },
  { key: "sd", label: "Sindhi", flag: "🇵🇰" },
  { key: "gu", label: "Gujarati", flag: "🇮🇳" },
  { key: "am", label: "Amharic", flag: "🇪🇷" },
  { key: "yi", label: "Yiddish", flag: "🇮🇱" },
  { key: "lo", label: "Lao", flag: "🇱🇦" },
  { key: "uz", label: "Uzbek", flag: "🇺🇿" },
  { key: "fo", label: "Faroese", flag: "🇫🇴" },
  { key: "ht", label: "Haitian Creole", flag: "🇭🇹" },
  { key: "ps", label: "Pashto", flag: "🇦🇫" },
  { key: "tk", label: "Turkmen", flag: "🇹🇲" },
  { key: "nn", label: "Nynorsk", flag: "🇳🇴" },
  { key: "mt", label: "Maltese", flag: "🇲🇹" },
  { key: "sa", label: "Sanskrit", flag: "🇮🇳" },
  { key: "lb", label: "Luxembourgish", flag: "🇱🇺" },
  { key: "my", label: "Myanmar", flag: "🇲🇲" },
  { key: "bo", label: "Tibetan", flag: "🇨🇳" },
  { key: "tl", label: "Tagalog", flag: "🇵🇭" },
  { key: "mg", label: "Malagasy", flag: "🇲🇬" },
  { key: "as", label: "Assamese", flag: "🇮🇳" },
  { key: "tt", label: "Tatar", flag: "🇹🇷" },
  { key: "haw", label: "Hawaiian", flag: "🇺🇸" },
  { key: "ln", label: "Lingala", flag: "🇨🇩" },
  { key: "ha", label: "Hausa", flag: "🇳🇬" },
  { key: "ba", label: "Bashkir", flag: "🇷🇺" },
  { key: "jw", label: "Javanese", flag: "🇮🇩" },
  { key: "su", label: "Sundanese", flag: "🇮🇩" },
  { key: "yue", label: "Cantonese", flag: "🇭🇰" },
];

export default function RecipePreferencesScreen() {
  const { kind, value } = useLocalSearchParams<{
    kind: string;
    value: string;
  }>();
  const [languageCode, setLanguageCode] = useState("");
  const [folderID, setFolderID] = useState("");
  const [selector, setSelector] = useState<"language" | "folder" | null>(null);
  const [languageSearch, setLanguageSearch] = useState("");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectorRef = useRef<BottomSheetMethods>(null);
  const [error, setError] = useState("");
  const foldersQuery = useFolders();
  const createFolder = useCreateFolder();
  const link = useImportLink();
  const preferences = {
    language_code: languageCode || undefined,
    folder_id: folderID || undefined,
  };
  const openSelector = (next: "language" | "folder") => {
    setSelector(next);
    if (next === "language") setLanguageSearch("");
    setTimeout(() => selectorRef.current?.present(), 0);
  };
  const closeSelector = () => selectorRef.current?.close();
  const saveFolder = async () => {
    const name = newFolder.trim();
    if (!name || createFolder.isPending) return;
    try {
      const folder = await createFolder.mutateAsync(name);
      setFolderID(folder.id);
      setNewFolder("");
      setCreateFolderOpen(false);
    } catch {
      // The mutation error is displayed by the modal below.
    }
  };

  const continueImport = () => {
    if (submitting || link.isPending) return;
    setError("");
    setSubmitting(true);
    if (kind !== "link") {
      router.push({
        pathname: "/recipe/direct-processing",
        params: {
          kind,
          value,
          language_code: languageCode,
          folder_id: folderID,
        },
      });
      return;
    }
    link.mutate(
      { url: value, preferences },
      {
        onSuccess: (result) =>
          router.replace({
            pathname: "/recipe/processing",
            params: { runID: result.run_id, url: value },
          }),
        onError: (reason) => {
          setSubmitting(false);
          setError(reason.message);
        },
      },
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={23} color={colors.ink} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Recipe preferences</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.eyebrow}>ONE LAST DETAIL</ThemedText>
          <ThemedText style={styles.title}>How should we save it?</ThemedText>
          <ThemedText style={styles.description}>
            Choose the recipe language and folder before Yuzu starts creating
            it.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>Language</ThemedText>
          <Pressable
            style={styles.selectorButton}
            onPress={() => openSelector("language")}
          >
            <ThemedText style={styles.choiceText}>
              {languages.find((language) => language.key === languageCode)
                ?.label ?? "Auto"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <ThemedText style={styles.sectionTitle}>Folder</ThemedText>
          <Pressable
            style={styles.selectorButton}
            onPress={() => openSelector("folder")}
          >
            <ThemedText style={styles.choiceText}>
              {folderID
                ? (foldersQuery.folders.find((folder) => folder.id === folderID)
                    ?.name ?? "Selected folder")
                : "No folder"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <Pressable
            style={[
              styles.button,
              (submitting || link.isPending) && styles.disabled,
            ]}
            disabled={submitting || link.isPending}
            onPress={continueImport}
          >
            {submitting || link.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Continue</ThemedText>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
      <BottomSheet
        ref={selectorRef}
        index={-1}
        snapPoints={[selector === "folder" ? "70%" : "42%"]}
        enablePanDownToClose
        onClose={() => setSelector(null)}
        backgroundStyle={styles.sheet}
      >
        <BottomSheetView style={styles.sheetView}>
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>
              {selector === "folder" ? "Choose a folder" : "Choose a language"}
            </ThemedText>
            <Pressable onPress={closeSelector} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          {selector === "language" ? (
            <View style={styles.selectorBody}>
              <TextInput
                accessibilityLabel="Search languages"
                placeholder="Search language"
                placeholderTextColor={colors.muted}
                value={languageSearch}
                onChangeText={setLanguageSearch}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />
              <FlashList
                data={languages.filter((language) =>
                  `${language.label} ${language.key}`
                    .toLowerCase()
                    .includes(languageSearch.trim().toLowerCase()),
                )}
                style={styles.selectorList}
                keyExtractor={(item) => item.key || "auto"}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.choice,
                      languageCode === item.key && styles.selected,
                    ]}
                    onPress={() => {
                      setLanguageCode(item.key);
                      closeSelector();
                    }}
                  >
                    <ThemedText style={styles.flag} numberOfLines={1}>
                      {item.flag}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.choiceText,
                        languageCode === item.key && styles.selectedText,
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                    {languageCode === item.key && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.leaf}
                      />
                    )}
                  </Pressable>
                )}
              />
            </View>
          ) : (
            <View style={styles.selectorBody}>
              <Pressable
                style={styles.newFolder}
                onPress={() => {
                  closeSelector();
                  setCreateFolderOpen(true);
                }}
              >
                <Ionicons name="add" size={18} color={colors.leaf} />
                <ThemedText style={styles.newFolderText}>New folder</ThemedText>
              </Pressable>
              <FlashList
                data={foldersQuery.folders}
                style={styles.selectorList}
                keyExtractor={(item) => item.id}
                onEndReached={() => {
                  if (
                    foldersQuery.hasNextPage &&
                    !foldersQuery.isFetchingNextPage
                  )
                    foldersQuery.fetchNextPage();
                }}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.choice,
                      folderID === item.id && styles.selected,
                    ]}
                    onPress={() => {
                      setFolderID(item.id);
                      closeSelector();
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.choiceText,
                        folderID === item.id && styles.selectedText,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </ThemedText>
                    {folderID === item.id && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.leaf}
                      />
                    )}
                  </Pressable>
                )}
                ListHeaderComponent={
                  <Pressable
                    style={[styles.choice, !folderID && styles.selected]}
                    onPress={() => {
                      setFolderID("");
                      closeSelector();
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.choiceText,
                        !folderID && styles.selectedText,
                      ]}
                    >
                      No folder
                    </ThemedText>
                    {!folderID && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.leaf}
                      />
                    )}
                  </Pressable>
                }
                ListFooterComponent={
                  foldersQuery.isFetchingNextPage ? (
                    <ActivityIndicator color={colors.leaf} />
                  ) : null
                }
                ListEmptyComponent={
                  foldersQuery.isPending ? (
                    <ActivityIndicator color={colors.leaf} />
                  ) : null
                }
              />
            </View>
          )}
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
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <ThemedText style={styles.modalTitle}>Create a folder</ThemedText>
            <ThemedText style={styles.modalBody}>
              Keep this recipe easy to find later.
            </ThemedText>
            <TextInput
              autoFocus
              placeholder="Folder name"
              placeholderTextColor={colors.muted}
              value={newFolder}
              onChangeText={setNewFolder}
              style={styles.modalInput}
            />
            {createFolder.isError && (
              <ThemedText style={styles.error}>
                {createFolder.error.message}
              </ThemedText>
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setCreateFolderOpen(false)}
              >
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalSave, !newFolder.trim() && styles.disabled]}
                onPress={saveFolder}
              >
                <ThemedText style={styles.modalSaveText}>
                  {createFolder.isPending ? "Creating…" : "Create"}
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  safe: { flex: 1 },
  header: {
    minHeight: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  headerSpacer: { width: 44 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sage,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  eyebrow: {
    color: colors.tomato,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: "900", marginTop: 7 },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 8,
  },
  selectorButton: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choice: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  selected: { backgroundColor: colors.sage, borderColor: colors.leaf },
  choiceText: { color: colors.ink, fontSize: 15, fontWeight: "700", flex: 1 },
  selectedText: { color: colors.leaf },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetView: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sheetTitle: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  sheetOptions: { gap: 2 },
  flag: { width: 58, flexShrink: 0, fontSize: 20 },
  selectorList: { flex: 1 },
  selectorBody: { flex: 1 },
  newFolder: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: colors.sage,
    marginBottom: 8,
  },
  newFolderText: { color: colors.leaf, fontSize: 15, fontWeight: "800" },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#14231A66",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: colors.paper,
    padding: 22,
  },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  modalBody: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 7,
    marginBottom: 16,
  },
  modalInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalCancel: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { color: colors.muted, fontWeight: "800" },
  modalSave: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { color: "#fff", fontWeight: "800" },
  error: { color: colors.tomato, fontSize: 13, marginTop: 8 },
  button: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.65 },
});
