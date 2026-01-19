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
    // Command Palette
    keybindingEngine.registerCommand({
        id: "command-palette.toggle",
        label: "Toggle Command Palette",
        category: "General",
        handler: () => {
            useAppStore.getState().toggleCommandPalette();
        },
    });

    // Modal controls
    keybindingEngine.registerCommand({
        id: "modal.close",
        label: "Close Modal",
        category: "General",
        handler: () => {
            const store = useAppStore.getState();
            if (store.commandPaletteOpen) {
                store.toggleCommandPalette();
            }
        },
    });

    // Repository actions
    keybindingEngine.registerCommand({
        id: "repository.refresh",
        label: "Refresh Repository Status",
        category: "Repository",
        handler: () => {
            useAppStore.getState().refreshRepositoryStatus();
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

    keybindingEngine.registerCommand({
        id: "navigation.down",
        label: "Navigate Down",
        category: "Navigation",
        handler: () => {
            // Dispatch custom event for list components to handle
            window.dispatchEvent(new CustomEvent("pinax:navigate", { detail: "down" }));
        },
    });

    keybindingEngine.registerCommand({
        id: "navigation.up",
        label: "Navigate Up",
        category: "Navigation",
        handler: () => {
            window.dispatchEvent(new CustomEvent("pinax:navigate", { detail: "up" }));
        },
    });

    keybindingEngine.registerCommand({
        id: "item.select",
        label: "Select Item",
        category: "Navigation",
        handler: () => {
            window.dispatchEvent(new CustomEvent("pinax:select"));
        },
    });

    // Workspace selection
    for (let i = 1; i <= 3; i++) {
        keybindingEngine.registerCommand({
            id: `workspace.select.${i}`,
            label: `Select Workspace ${i}`,
            category: "Workspace",
            handler: () => {
                const workspaces = useAppStore.getState().workspaces;
                if (workspaces[i - 1]) {
                    useAppStore.getState().setSelectedWorkspace(workspaces[i - 1].id);
                }
            },
        });
    }
}

/**
 * Get the context for keybinding conditions
 */
export function getKeyBindingContext(): Record<string, boolean> {
    const store = useAppStore.getState();
    return {
        modalOpen: store.commandPaletteOpen,
        listFocused: store.navigationContext === "sidebar",
    };
}
