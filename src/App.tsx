/**
 * Pinax - Keyboard-First Git Workbench
 * Root application component
 */

import { MainLayout } from "@/components/layout";
import { CommandPalette } from "@/components/command-palette";
import { useKeyBindings } from "@/hooks";
import "./index.css";

export default function App() {
  // Initialize keybinding engine
  useKeyBindings();

  return (
    <>
      <MainLayout />
      <CommandPalette />
    </>
  );
}
