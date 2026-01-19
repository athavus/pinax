/**
 * React hook for keybinding management
 * Sets up the global keyboard listener and context provider
 */

import { useEffect } from "react";
import {
    keybindingEngine,
    registerCoreCommands,
    getKeyBindingContext,
} from "@/lib/keybindings";
import keybindingsConfig from "@/keybindings.json";

/**
 * Initialize and manage keybindings for the application
 */
export function useKeyBindings(): void {
    useEffect(() => {
        // Load bindings from config
        keybindingEngine.loadBindings(keybindingsConfig.bindings);

        // Register core commands
        registerCoreCommands();

        // Set up context provider
        keybindingEngine.setContextProvider(getKeyBindingContext);

        // Global keyboard listener
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore events from input fields unless it's a modifier key combo
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    return;
                }
            }

            keybindingEngine.handleKeyEvent(event);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);
}
