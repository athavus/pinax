import { MainLayout } from "@/components/layout";
import { QuickSearch } from "@/components/QuickSearch";
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
    loadAvailableEditors();
  }, [loadAvailableEditors]);

  return (
    <>
      <MainLayout />
      <QuickSearch />
    </>
  );
}
