import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface UiState {
  theme: Theme;
  isMobileNavOpen: boolean;
  isSidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "system",
      isMobileNavOpen: false,
      isSidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
      toggleSidebar: () => set({ isSidebarCollapsed: !get().isSidebarCollapsed }),
    }),
    {
      name: "lumera.ui",
      partialize: (state) => ({ theme: state.theme, isSidebarCollapsed: state.isSidebarCollapsed }),
    },
  ),
);
