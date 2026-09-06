import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type RecipeViewMode = "grid" | "list";

type RecipePreferencesState = {
  viewMode: RecipeViewMode;
  setViewMode: (viewMode: RecipeViewMode) => void;
};

const storage = createJSONStorage(() => ({
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
}));

export const useRecipePreferences = create<RecipePreferencesState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    { name: "recipe-preferences", storage },
  ),
);
