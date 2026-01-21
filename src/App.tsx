import { MainLayout } from "@/components/layout";
import { useKeyBindings } from "@/hooks";
import { useAppStore } from "@/stores/appStore";
import React from "react";
import "./index.css";

export default function App() {
  // Initialize keybinding engine
  useKeyBindings();
  const { loadAvailableEditors } = useAppStore();

  // Force dark mode and load editors
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    loadAvailableEditors();
  }, [loadAvailableEditors]);

  return (
    <>
      <MainLayout />
    </>
  );
}
