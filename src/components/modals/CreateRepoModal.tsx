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
import { FolderOpen, Github, Loader2, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateRepoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateRepoModal({ open: isOpen, onOpenChange }: CreateRepoModalProps) {
    const { publishRepository, isLoading, settings, error, clearError } = useAppStore();

    const [name, setName] = useState("");
    const [localPath, setLocalPath] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [token, setToken] = useState(settings.githubToken || "");
    const [saveToken, setSaveToken] = useState(true);

    const [addReadme, setAddReadme] = useState(true);
    const [gitignoreType, setGitignoreType] = useState("node");
    const [addLicense, setAddLicense] = useState(true);

    useEffect(() => {
        if (isOpen) {
            clearError();
            if (settings.githubToken) {
                setToken(settings.githubToken);
            }
        }
    }, [isOpen, settings.githubToken, clearError]);

    const handleBrowse = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Local Directory"
            });

            if (selected && typeof selected === "string") {
                setLocalPath(selected);
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

            await publishRepository(
                localPath,
                name,
                token,
                description || undefined,
                isPrivate,
                {
                    readme: addReadme,
                    gitignore: gitignoreType === "none" ? "" : gitignoreType,
                    license: addLicense
                }
            );

            // Only close if no error was set in the store during publish
            // (The error state in the store is updated inside publishRepository)
            const currentError = useAppStore.getState().error;
            if (!currentError) {
                onOpenChange(false);
                setName("");
                setLocalPath("");
                setDescription("");
                setIsPrivate(false);
            }
        } catch (error) {
            console.error("Publishing failed in modal:", error);
            // Error is already handled/set in the store by publishRepository
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent hideClose className="sm:max-w-[480px] max-w-[480px] p-0 overflow-hidden outline-none ring-0">
                <div className="px-8 py-10">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted/40 flex items-center justify-center rounded-none shrink-0">
                                <Github className="w-5 h-5 text-foreground/60" />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                                <DialogTitle className="text-lg font-black uppercase tracking-[0.2em] text-foreground leading-none">
                                    Create Repository
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground/20 text-[9px] uppercase font-black tracking-[0.2em]">
                                    Local initialization & GitHub sync
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
                        {/* Repository Name */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 pl-1">
                                Repository Name
                            </label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="my-repo-name"
                                className="w-full min-w-0 bg-muted/30 px-5 py-4 text-sm font-medium placeholder:text-muted-foreground/5 !border-none !ring-0 !outline-none focus:ring-0 focus-visible:ring-0 focus:outline-none focus:bg-muted/50 transition-all overflow-hidden text-ellipsis"
                                style={{ maxWidth: '100%' }}
                            />
                        </div>

                        {/* Local Destination */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 pl-1">
                                Local Destination
                            </label>
                            <div className="flex bg-muted/30 focus-within:bg-muted/50 transition-all min-w-0">
                                <input
                                    value={localPath}
                                    readOnly
                                    placeholder="/home/user/workspace/..."
                                    className="flex-1 min-w-0 bg-transparent px-5 py-4 text-[11px] font-mono text-muted-foreground/40 cursor-default truncate !border-none !ring-0 !outline-none focus:ring-0 focus-visible:ring-0 focus:outline-none"
                                />
                                <button
                                    onClick={handleBrowse}
                                    className="px-5 bg-muted/40 text-muted-foreground/30 hover:text-foreground hover:bg-muted/60 transition-all flex items-center justify-center shrink-0"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Templates */}
                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 pl-1">
                                Options
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setAddReadme(!addReadme)}
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-3.5 transition-all text-left",
                                        addReadme ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted-foreground/15 hover:bg-muted/40"
                                    )}
                                >
                                    <div className={cn("w-3 h-3 flex items-center justify-center rounded-none", addReadme ? "bg-primary text-primary-foreground" : "bg-muted/40")}>
                                        {addReadme && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">README</span>
                                </button>
                                <button
                                    onClick={() => setAddLicense(!addLicense)}
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-3.5 transition-all text-left",
                                        addLicense ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted-foreground/15 hover:bg-muted/40"
                                    )}
                                >
                                    <div className={cn("w-3 h-3 flex items-center justify-center rounded-none", addLicense ? "bg-primary text-primary-foreground" : "bg-muted/40")}>
                                        {addLicense && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider">LICENSE</span>
                                </button>
                            </div>

                            <div className="relative bg-muted/30 transition-all">
                                <select
                                    value={gitignoreType}
                                    onChange={(e) => setGitignoreType(e.target.value)}
                                    className="w-full bg-transparent px-5 py-3.5 text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none text-muted-foreground/40 cursor-pointer pr-10"
                                >
                                    <option value="none" className="bg-card">No .gitignore</option>
                                    <option value="node" className="bg-card">Node / JavaScript</option>
                                    <option value="python" className="bg-card">Python</option>
                                    <option value="rust" className="bg-card">Rust</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/10">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            {/* Privacy Checkbox (New Style) */}
                            <button
                                onClick={() => setIsPrivate(!isPrivate)}
                                className="flex items-center gap-3 group px-1 py-1 mt-2 border-none ring-0 outline-none"
                            >
                                <div className={cn(
                                    "w-3.5 h-3.5 transition-all flex items-center justify-center rounded-none",
                                    isPrivate ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/40 group-hover:bg-muted/60"
                                )}>
                                    {isPrivate && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors">
                                    Keep this repository private
                                </span>
                            </button>
                        </div>

                        {/* GitHub Integration */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                                    GitHub Token
                                </label>
                                <a
                                    href="https://github.com/settings/tokens"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-primary/30 hover:text-primary transition-all font-black uppercase tracking-widest"
                                >
                                    New Token
                                </a>
                            </div>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className="w-full min-w-0 bg-muted/30 px-5 py-4 text-sm font-mono !border-none !ring-0 !outline-none focus:ring-0 focus-visible:ring-0 focus:outline-none focus:bg-muted/50 transition-all placeholder:text-muted-foreground/5 overflow-hidden text-ellipsis"
                                style={{ maxWidth: '100%' }}
                            />
                            <button
                                onClick={() => setSaveToken(!saveToken)}
                                className="flex items-center gap-3 group px-1"
                            >
                                <div className={cn(
                                    "w-3 h-3 transition-all flex items-center justify-center rounded-none",
                                    saveToken ? "bg-muted-foreground/20 text-foreground" : "bg-muted/40"
                                )}>
                                    {saveToken && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors">
                                    Remember token locally
                                </span>
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}
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
                        onClick={handlePublish}
                        disabled={!name || !localPath || !token || isLoading}
                        className="flex-1 max-w-[180px] min-w-[120px] h-12 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-5 flex items-center justify-center gap-3 shadow-xl shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Create"
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
