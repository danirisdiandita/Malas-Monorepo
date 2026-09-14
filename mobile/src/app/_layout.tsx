import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useRef } from "react";
import { Toaster } from "sonner-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ShareIntentProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <QueryClientProvider client={queryClient}>
            <ShareIntentRouter />
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}

function ShareIntentRouter() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const handledURL = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!hasShareIntent) return;
    const url = shareIntent.webUrl ?? shareIntent.text?.match(/https?:\/\/\S+/)?.[0];
    if (!url || handledURL.current === url) return;
    handledURL.current = url;

    router.push({ pathname: "/recipe/preferences", params: { kind: "link", value: url.trim() } });
    resetShareIntent(true);
  }, [hasShareIntent, resetShareIntent, shareIntent]);

  return null;
}
