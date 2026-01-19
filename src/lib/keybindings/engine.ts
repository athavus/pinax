/**
 * Keybinding Engine
 * 
 * Handles registration, parsing, and dispatch of keyboard shortcuts.
 * Supports context conditions (when clauses) for scoped shortcuts.
 */

import type { KeyBinding, CommandHandler, ParsedKey } from "./types";

class KeyBindingEngine {
    private bindings: KeyBinding[] = [];
    private commands: Map<string, CommandHandler> = new Map();
    private contextProvider: (() => Record<string, boolean>) | null = null;

    /**
     * Load keybindings from configuration
     */
    loadBindings(bindings: KeyBinding[]): void {
        this.bindings = bindings;
    }

    /**
     * Register a command handler
     */
    registerCommand(handler: CommandHandler): void {
        this.commands.set(handler.id, handler);
    }

    /**
     * Unregister a command handler
     */
    unregisterCommand(id: string): void {
        this.commands.delete(id);
    }

    /**
     * Set the context provider function
     * This is called to evaluate "when" conditions
     */
    setContextProvider(provider: () => Record<string, boolean>): void {
        this.contextProvider = provider;
    }

    /**
     * Get all registered commands (for command palette)
     */
    getCommands(): CommandHandler[] {
        return Array.from(this.commands.values());
    }

    /**
     * Get all bindings (for displaying shortcuts in UI)
     */
    getBindings(): KeyBinding[] {
        return this.bindings;
    }

    /**
     * Get the shortcut string for a command
     */
    getShortcutForCommand(commandId: string): string | undefined {
        const binding = this.bindings.find((b) => b.command === commandId);
        if (!binding) return undefined;
        return this.formatKeyForDisplay(binding.key);
    }

    /**
     * Handle a keyboard event
     * Returns true if the event was handled (a command was executed)
     */
    handleKeyEvent(event: KeyboardEvent): boolean {
        const parsed = this.parseKeyEvent(event);
        const context = this.contextProvider?.() ?? {};

        for (const binding of this.bindings) {
            if (this.matchesBinding(parsed, binding, context)) {
                const command = this.commands.get(binding.command);
                if (command) {
                    event.preventDefault();
                    command.handler();
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Execute a command by ID (for command palette)
     */
    executeCommand(commandId: string): boolean {
        const command = this.commands.get(commandId);
        if (command) {
            command.handler();
            return true;
        }
        return false;
    }

    /**
     * Parse a keyboard event into a structured format
     */
    private parseKeyEvent(event: KeyboardEvent): ParsedKey {
        return {
            modifiers: {
                ctrl: event.ctrlKey,
                alt: event.altKey,
                shift: event.shiftKey,
                meta: event.metaKey,
            },
            key: event.key.toLowerCase(),
        };
    }

    /**
     * Parse a binding string (e.g., "mod+shift+p") into structured format
     */
    private parseBindingString(str: string): ParsedKey {
        const parts = str.toLowerCase().split("+");
        const key = parts.pop() || "";
        const modifiers = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false,
        };

        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

        for (const part of parts) {
            switch (part) {
                case "mod":
                    // mod = cmd on Mac, ctrl on others
                    if (isMac) {
                        modifiers.meta = true;
                    } else {
                        modifiers.ctrl = true;
                    }
                    break;
                case "ctrl":
                    modifiers.ctrl = true;
                    break;
                case "alt":
                    modifiers.alt = true;
                    break;
                case "shift":
                    modifiers.shift = true;
                    break;
                case "meta":
                case "cmd":
                    modifiers.meta = true;
                    break;
            }
        }

        return { modifiers, key };
    }

    /**
     * Check if a key event matches a binding
     */
    private matchesBinding(
        event: ParsedKey,
        binding: KeyBinding,
        context: Record<string, boolean>
    ): boolean {
        // Check when condition
        if (binding.when && !context[binding.when]) {
            return false;
        }

        const parsed = this.parseBindingString(binding.key);

        return (
            event.key === parsed.key &&
            event.modifiers.ctrl === parsed.modifiers.ctrl &&
            event.modifiers.alt === parsed.modifiers.alt &&
            event.modifiers.shift === parsed.modifiers.shift &&
            event.modifiers.meta === parsed.modifiers.meta
        );
    }

    /**
     * Format a key binding for display (e.g., "⌘P" on Mac, "Ctrl+P" on others)
     */
    private formatKeyForDisplay(str: string): string {
        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        const parts = str.split("+");
        const formatted: string[] = [];

        for (const part of parts) {
            switch (part.toLowerCase()) {
                case "mod":
                    formatted.push(isMac ? "⌘" : "Ctrl");
                    break;
                case "ctrl":
                    formatted.push(isMac ? "⌃" : "Ctrl");
                    break;
                case "alt":
                    formatted.push(isMac ? "⌥" : "Alt");
                    break;
                case "shift":
                    formatted.push(isMac ? "⇧" : "Shift");
                    break;
                case "meta":
                case "cmd":
                    formatted.push("⌘");
                    break;
                case "escape":
                    formatted.push("Esc");
                    break;
                case "enter":
                    formatted.push("↵");
                    break;
                default:
                    formatted.push(part.toUpperCase());
            }
        }

        return isMac ? formatted.join("") : formatted.join("+");
    }
}

// Singleton instance
export const keybindingEngine = new KeyBindingEngine();
