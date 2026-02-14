import { useAppStore } from "@/stores/appStore";
import { keybindingEngine } from "@/lib/keybindings/engine";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

export function ShortcutsModal() {
    const { shortcutsModalOpen, setShortcutsModalOpen } = useAppStore();

    const commands = keybindingEngine.getCommands();
    const bindings = keybindingEngine.getBindings();

    // Group commands by category
    const categories = Array.from(new Set(commands.map((c) => c.category)));

    const getBindingDisplay = (commandId: string) => {
        const binding = bindings.find((b) => b.command === commandId);
        if (!binding) return null;

        return binding.key.split("+").map((part) => {
            if (part === "mod") return "CTRL";
            return part.toUpperCase();
        }).join(" + ");
    };

    return (
        <Dialog open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen}>
            <DialogContent className="max-w-2xl bg-[hsl(var(--card))] text-foreground border-border p-0 overflow-hidden shadow-2xl rounded-3xl">
                <DialogHeader className="p-8 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-muted text-foreground">
                            <Keyboard className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Command Palette</DialogTitle>
                            <p className="text-sm text-muted-foreground font-medium tracking-tight">Keyboard shortcuts and available commands</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar bg-card">
                    {categories.map((category) => {
                        const categoryCommands = commands.filter((c) => c.category === category);
                        if (categoryCommands.length === 0) return null;

                        return (
                            <div key={category} className="mb-8 last:mb-0">
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">{category}</h3>
                                <div className="space-y-1">
                                    {categoryCommands.map((cmd) => (
                                        <div
                                            key={cmd.id}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-default"
                                        >
                                            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{cmd.label}</span>
                                            <div className="flex gap-1.5">
                                                {getBindingDisplay(cmd.id)?.split(" + ").map((key, i) => (
                                                    <kbd
                                                        key={i}
                                                        className="px-2 py-1 min-w-[2.5rem] text-center bg-card border border-border rounded-lg text-[10px] font-black shadow-sm text-muted-foreground group-hover:text-foreground group-hover:border-accent transition-all font-mono"
                                                    >
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Pinax v1.2.0</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
