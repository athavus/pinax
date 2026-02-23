import { MainLayout } from "@/components/layout";
import { QuickSearch } from "@/components/QuickSearch";
import { ShortcutsModal } from "@/components/modals/ShortcutsModal";
import { GitConfigModal } from "@/components/modals/GitConfigModal";
import { useKeyBindings, useTheme } from "@/hooks";
import { useAppStore } from "@/stores/appStore";
import React from "react";
import "./index.css";

export default function App() {
  // Initialize keybinding engine and theme
  useKeyBindings();
  useTheme();
  const { loadAvailableEditors } = useAppStore();

  React.useEffect(() => {
    // Focus window to ensure keybindings work immediately
    window.focus();
    loadAvailableEditors();
  }, [loadAvailableEditors]);

  return (
    <>
      <MainLayout />
      <QuickSearch />
      <ShortcutsModal />
      <GitConfigModal />
    </>
  );
}
