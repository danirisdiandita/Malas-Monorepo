import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useImportPhoto, useImportText } from "@/hooks/use-import-link";

export default function DirectProcessingScreen() {
  const { kind, value, language_code, folder_id } = useLocalSearchParams<{ kind: string; value: string; language_code?: string; folder_id?: string }>();
  const photo = useImportPhoto();
  const text = useImportText();
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !value) return;
    started.current = true;
    const preferences = { language_code: language_code || undefined, folder_id: folder_id || undefined };
    const onSuccess = (result: { recipe_id: string }) => router.replace({ pathname: "/recipe/[id]", params: { id: result.recipe_id } });
    if (kind === "photo") photo.mutate({ uri: value, preferences }, { onSuccess });
    else text.mutate({ text: value, preferences }, { onSuccess });
  }, [folder_id, kind, language_code, photo, text, value]);
  const error = photo.error || text.error;
  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <Image source={require("@/assets/images/yuzu-logo-transparent.png")} style={styles.logo} resizeMode="contain" />
        {error ? <Ionicons name="alert-circle-outline" size={34} color={colors.tomato} /> : <ActivityIndicator size="large" color={colors.leaf} />}
        <ThemedText style={styles.title}>{error ? "Recipe needs another try" : "Creating your recipe"}</ThemedText>
        <ThemedText style={styles.description}>{error ? error.message : "Yuzu is reading your recipe and organizing it for you."}</ThemedText>
        {error && <ThemedText style={styles.back} onPress={() => router.back()}>Go back</ThemedText>}
      </View>
    </ThemedView>
  );
}

const colors = { ink: "#14231A", leaf: "#2F6B3E", muted: "#738078", tomato: "#E87955", paper: "#FCFBF8" };
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  logo: { width: 120, height: 120, marginBottom: 28 },
  title: { color: colors.ink, fontSize: 26, fontWeight: "900", textAlign: "center", marginTop: 20 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 10, maxWidth: 300 },
  back: { color: colors.leaf, fontSize: 15, fontWeight: "800", marginTop: 24 },
});
