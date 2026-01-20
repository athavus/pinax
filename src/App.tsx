/**
 * Pinax - Keyboard-First Git Workbench
 * Root application component
 */

import { MainLayout } from "@/components/layout";
import { useKeyBindings } from "@/hooks";
import React from "react";
import "./index.css";

export default function App() {
  // Initialize keybinding engine
  useKeyBindings();

  // Force dark mode
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      <MainLayout />
    </>
  );
}
