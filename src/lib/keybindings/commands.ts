/**
 * Command registration for the keybinding system
 * Connects keybindings to actual application actions
 */

import { keybindingEngine } from "./engine";
import { useAppStore } from "@/stores/appStore";

/**
 * Register all core commands with the keybinding engine
 */
export function registerCoreCommands(): void {
    // Repository actions
    keybindingEngine.registerCommand({
        id: "repository.refresh",
        label: "Refresh Repository Status",
        category: "Repository",
        handler: () => {
            useAppStore.getState().refreshRepositoryStatus();
        },
    });

    keybindingEngine.registerCommand({
        id: "repository.push",
        label: "Git Push",
        category: "Repository",
        handler: () => {
            useAppStore.getState().push();
        },
    });

    keybindingEngine.registerCommand({
        id: "repository.pull",
        label: "Git Pull",
        category: "Repository",
        handler: () => {
            useAppStore.getState().pull();
        },
    });

    // Quick Search
    keybindingEngine.registerCommand({
        id: "quickSearch.open",
        label: "Quick Open",
        category: "Navigation",
        handler: () => {
            window.dispatchEvent(new CustomEvent("quick-search-open"));
        },
    });

    // Navigation
    keybindingEngine.registerCommand({
        id: "sidebar.focus",
        label: "Focus Sidebar",
        category: "Navigation",
        handler: () => {
            useAppStore.getState().setNavigationContext("sidebar");
            document.querySelector<HTMLElement>("[data-sidebar]")?.focus();
        },
    });

    // External Tools
    keybindingEngine.registerCommand({
        id: "editor.open",
        label: "Open in Editor",
        category: "External Tools",
        handler: () => {
            useAppStore.getState().openRepositoryInEditor();
        },
    });

    keybindingEngine.registerCommand({
        id: "terminal.open",
        label: "Open Terminal",
        category: "External Tools",
        handler: () => {
            useAppStore.getState().openTerminal();
        },
    });

    keybindingEngine.registerCommand({
        id: "fileExplorer.open",
        label: "Open File Explorer",
        category: "External Tools",
        handler: () => {
            useAppStore.getState().openFileManager();
        },
    });

    // Shortcuts Modal
    keybindingEngine.registerCommand({
        id: "shortcuts.show",
        label: "Show Commands",
        category: "Navigation",
        handler: () => {
            useAppStore.getState().setShortcutsModalOpen(true);
        },
    });
}

/**
 * Get the context for keybinding conditions
 */
export function getKeyBindingContext(): Record<string, boolean> {
    const store = useAppStore.getState();
    return {
        listFocused: store.navigationContext === "sidebar",
    };
}
