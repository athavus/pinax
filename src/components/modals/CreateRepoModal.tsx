/**
 * Modal for creating a new local repository and publishing it to GitHub
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
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Github, Globe, Lock, Loader2, Key } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateRepoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateRepoModal({ open: isOpen, onOpenChange }: CreateRepoModalProps) {
    const { publishRepository, isLoading } = useAppStore();

    const [name, setName] = useState("");
    const [localPath, setLocalPath] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [token, setToken] = useState("");
    const [saveToken, setSaveToken] = useState(true);

    // Load saved token from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("github_token");
        if (savedToken) setToken(savedToken);
    }, []);

    const handleBrowse = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select local directory for the repository"
            });

            if (selected && typeof selected === "string") {
                setLocalPath(selected);
                // Auto-fill name if empty
                if (!name) {
                    const parts = selected.split(/[\/\\]/);
                    const lastPart = parts[parts.length - 1];
                    if (lastPart) setName(lastPart);
                }
            }
        } catch (error) {
            console.error("Failed to open dialog:", error);
        }
    };

    const handlePublish = async () => {
        if (!name || !localPath || !token) return;

        try {
            if (saveToken) {
                localStorage.setItem("github_token", token);
            } else {
                localStorage.removeItem("github_token");
            }

            await publishRepository(localPath, name, token, description || undefined, isPrivate);
            onOpenChange(false);
            // Reset form
            setName("");
            setLocalPath("");
            setDescription("");
            setIsPrivate(false);
        } catch (error) {
            console.error("Publishing failed:", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border/40 p-0 overflow-hidden rounded-none shadow-2xl">
                <div className="h-1 bg-primary w-full shadow-[0_0_12px_rgba(var(--primary),0.3)]" />

                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-none bg-primary/10 text-primary">
                                <Github className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-xl font-black uppercase tracking-widest italic">
                                Create & Publish
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-muted-foreground/60 text-xs font-medium">
                            Create a new local repository and push it to GitHub in one step.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Repository Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                Repository Name
                            </label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="my-awesome-project"
                                className="w-full bg-card/40 border border-border/10 p-3 text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                            />
                        </div>

                        {/* Local Path */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                Local Location
                            </label>
                            <div className="relative group">
                                <input
                                    value={localPath}
                                    onChange={(e) => setLocalPath(e.target.value)}
                                    placeholder="/home/user/projects/..."
                                    className="w-full bg-card/40 border border-border/10 p-3 pr-12 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono text-[11px]"
                                />
                                <button
                                    onClick={handleBrowse}
                                    className="absolute right-0 top-0 bottom-0 px-4 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                Description (Optional)
                            </label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of your project"
                                className="w-full bg-card/40 border border-border/10 p-3 text-sm focus:outline-none focus:border-primary/40 transition-all font-medium"
                            />
                        </div>

                        {/* GitHub Token */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                    GitHub Personal Access Token
                                </label>
                                <a
                                    href="https://github.com/settings/tokens"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-primary/60 hover:text-primary transition-colors font-bold flex items-center gap-1"
                                >
                                    GET TOKEN <Key className="w-2.5 h-2.5" />
                                </a>
                            </div>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className="w-full bg-card/40 border border-border/10 p-3 text-sm focus:outline-none focus:border-primary/40 transition-all font-mono"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="checkbox"
                                    id="save-token"
                                    checked={saveToken}
                                    onChange={(e) => setSaveToken(e.target.checked)}
                                    className="accent-primary"
                                />
                                <label htmlFor="save-token" className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-wider cursor-pointer">
                                    Remember token for next time
                                </label>
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => setIsPrivate(false)}
                                className={cn(
                                    "flex-1 p-4 border transition-all flex flex-col items-center gap-2 rounded-none",
                                    !isPrivate
                                        ? "bg-primary/5 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                        : "bg-card/40 border-border/10 text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <Globe className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Public</span>
                            </button>
                            <button
                                onClick={() => setIsPrivate(true)}
                                className={cn(
                                    "flex-1 p-4 border transition-all flex flex-col items-center gap-2 rounded-none",
                                    isPrivate
                                        ? "bg-primary/5 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                        : "bg-card/40 border-border/10 text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <Lock className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Private</span>
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex gap-3">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={!name || !localPath || !token || isLoading}
                        className="flex-[2] py-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            "Create & Publish"
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
