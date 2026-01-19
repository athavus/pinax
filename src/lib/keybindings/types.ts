/**
 * Keybinding types for the Pinax keybinding engine
 */

export interface KeyBinding {
    key: string;
    command: string;
    when?: string;
    description?: string;
}

export interface KeyBindingConfig {
    version: number;
    bindings: KeyBinding[];
}

export interface CommandHandler {
    id: string;
    label: string;
    category: string;
    handler: () => void;
}

export interface ParsedKey {
    modifiers: {
        ctrl: boolean;
        alt: boolean;
        shift: boolean;
        meta: boolean;
    };
    key: string;
}
