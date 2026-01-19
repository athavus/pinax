/**
 * Command Palette component
 * Provides quick access to all commands via keyboard
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { keybindingEngine } from "@/lib/keybindings";
import { Search, Command } from "lucide-react";

export function CommandPalette() {
    const { commandPaletteOpen, toggleCommandPalette } = useAppStore();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands = useMemo(() => {
        const allCommands = keybindingEngine.getCommands();
        if (!query) return allCommands;

        const lowerQuery = query.toLowerCase();
        return allCommands.filter(
            (cmd) =>
                cmd.label.toLowerCase().includes(lowerQuery) ||
                cmd.category.toLowerCase().includes(lowerQuery)
        );
    }, [query]);

    useEffect(() => {
        if (commandPaletteOpen) {
            setQuery("");
            setSelectedIndex(0);
            // Focus input after a short delay to ensure the modal is mounted
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [commandPaletteOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, commands.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                if (commands[selectedIndex]) {
                    commands[selectedIndex].handler();
                    toggleCommandPalette();
                }
                break;
            case "Escape":
                e.preventDefault();
                toggleCommandPalette();
                break;
        }
    };

    if (!commandPaletteOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
            onClick={toggleCommandPalette}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                className={cn(
                    "relative w-full max-w-lg rounded-lg overflow-hidden",
                    "bg-[hsl(var(--popover))] border border-[hsl(var(--border))]",
                    "shadow-2xl"
                )}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
                    <Search className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type a command..."
                        className={cn(
                            "flex-1 bg-transparent outline-none",
                            "text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                        )}
                    />
                    <kbd className="px-2 py-0.5 text-xs rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                        esc
                    </kbd>
                </div>

                {/* Command list */}
                <ul className="max-h-72 overflow-y-auto py-2">
                    {commands.length === 0 ? (
                        <li className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                            No commands found
                        </li>
                    ) : (
                        commands.map((cmd, index) => {
                            const shortcut = keybindingEngine.getShortcutForCommand(cmd.id);
                            return (
                                <li key={cmd.id}>
                                    <button
                                        onClick={() => {
                                            cmd.handler();
                                            toggleCommandPalette();
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2 text-left",
                                            "transition-colors duration-75",
                                            selectedIndex === index
                                                ? "bg-[hsl(var(--accent))]"
                                                : "hover:bg-[hsl(var(--accent))]"
                                        )}
                                    >
                                        <Command className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                                        <div className="flex-1">
                                            <p className="text-sm">{cmd.label}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                {cmd.category}
                                            </p>
                                        </div>
                                        {shortcut && (
                                            <kbd className="px-2 py-0.5 text-xs rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                                                {shortcut}
                                            </kbd>
                                        )}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        </div>
    );
}
