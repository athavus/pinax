/**
 * Modal for global application settings (GitHub Auth, Preferred Editor, etc.)
 */

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { useAppStore } from "@/stores/appStore";
import { Settings, Github, Code2, ChevronDown, Trash2 } from "lucide-react";

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open: isOpen, onOpenChange }: SettingsModalProps) {
    const { settings, updateSettings, availableEditors } = useAppStore();

    // Local state for immediate editing
    const [token, setToken] = useState(settings.githubToken);
    const [editor, setEditor] = useState(settings.preferredEditor);

    useEffect(() => {
        if (isOpen) {
            setToken(settings.githubToken);
            setEditor(settings.preferredEditor);
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        updateSettings({
            githubToken: token,
            preferredEditor: editor
        });
        onOpenChange(false);
    };

    const clearToken = () => setToken("");

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-w-[480px] bg-card border-border/40 p-0 overflow-hidden shadow-2xl rounded-none ring-0 outline-none">
                <div className="px-8 py-10">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted/40 flex items-center justify-center rounded-none shrink-0">
                                <Settings className="w-5 h-5 text-foreground/60" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                                <DialogTitle className="text-lg font-black uppercase tracking-[0.2em] text-foreground leading-none">
                                    Global Settings
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground/20 text-[9px] uppercase font-black tracking-[0.2em]">
                                    Configure core workbench behavior
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-8">
                        {/* GitHub Integration Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-muted/30 flex items-center justify-center">
                                    <Github className="w-3.5 h-3.5 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">GitHub Authentication</h3>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/20">
                                        Personal Access Token
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={clearToken}
                                            className="text-[9px] text-red-500/30 hover:text-red-500 transition-all font-black uppercase tracking-widest flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Clear
                                        </button>
                                        <a
                                            href="https://github.com/settings/tokens"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] text-primary/30 hover:text-primary transition-all font-black uppercase tracking-widest"
                                        >
                                            New Token
                                        </a>
                                    </div>
                                </div>
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    className="w-full min-w-0 bg-muted/30 px-5 py-4 text-sm font-mono !border-none !ring-0 !outline-none focus:ring-0 focus-visible:ring-0 focus:outline-none focus:bg-muted/50 transition-all placeholder:text-muted-foreground/5 overflow-hidden text-ellipsis"
                                    style={{ maxWidth: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Editor Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-muted/30 flex items-center justify-center">
                                    <Code2 className="w-3.5 h-3.5 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">Code Editor Preference</h3>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/20 pl-1">
                                    Preferred IDE / Editor
                                </label>
                                <div className="relative bg-muted/30 transition-all">
                                    <select
                                        value={editor}
                                        onChange={(e) => setEditor(e.target.value)}
                                        className="w-full bg-transparent px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] focus:outline-none appearance-none text-muted-foreground/60 cursor-pointer pr-10 hover:bg-muted/40 transition-all outline-none ring-0"
                                    >
                                        <option value="auto" className="bg-card">System Default (Auto)</option>
                                        {availableEditors.map((e) => (
                                            <option key={String(e.command)} value={String(e.command)} className="bg-card">
                                                {String(e.name)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/10">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-[9px] text-muted-foreground/10 uppercase font-black tracking-widest pl-1">
                                    This will be used when you select "Open in Editor"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-8 bg-muted/10 border-t border-border/20 flex items-center justify-between gap-4">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/10 hover:text-foreground transition-all shrink-0"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 max-w-[180px] min-w-[120px] h-12 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-3 shadow-xl shrink-0"
                    >
                        Save Config
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
