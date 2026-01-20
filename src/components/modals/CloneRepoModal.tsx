import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/appStore";
import { FolderOpen, Globe, Loader2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

interface CloneRepoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CloneRepoModal({ open: isOpen, onOpenChange }: CloneRepoModalProps) {
    const { cloneRepository, isLoading } = useAppStore();
    const [url, setUrl] = useState("");
    const [localPath, setLocalPath] = useState("");

    const handleBrowse = async () => {
        const selected = await open({
            directory: true,
            multiple: false,
            title: "Select Local Destination"
        });
        if (selected) {
            setLocalPath(selected as string);
        }
    };

    const handleClone = async () => {
        if (!url || !localPath) return;
        try {
            await cloneRepository(url, localPath);
            onOpenChange(false);
            setUrl("");
            setLocalPath("");
        } catch (error) {
            console.error("Clone failed:", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-[#0A0A0B] border-none p-0 overflow-hidden shadow-2xl rounded-none ring-0 outline-none">
                <div className="px-8 py-10">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/[0.03] flex items-center justify-center rounded-none">
                                <Globe className="w-5 h-5 text-foreground/60" />
                            </div>
                            <div className="space-y-0.5">
                                <DialogTitle className="text-lg font-black uppercase tracking-[0.2em] text-foreground leading-none">
                                    Clone Repository
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground/20 text-[9px] uppercase font-black tracking-[0.2em]">
                                    Download remote data to local disk
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Repository URL */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 pl-1">
                                Remote Source URL
                            </label>
                            <input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://github.com/user/repo"
                                className="w-full bg-white/[0.03] px-5 py-4 text-sm font-medium placeholder:text-muted-foreground/5 !border-none !ring-0 !outline-none focus:ring-0 focus-visible:ring-0 focus:outline-none focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        {/* Local Path */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 pl-1">
                                Local Destination
                            </label>
                            <div className="flex bg-white/[0.03] focus-within:bg-white/[0.05] transition-all">
                                <input
                                    value={localPath}
                                    readOnly
                                    placeholder="/home/user/workspace/..."
                                    className="flex-1 bg-transparent px-5 py-4 text-[11px] font-mono text-muted-foreground/40 cursor-default truncate !border-none !ring-0 !outline-none focus:ring-0 focus-visible:ring-0 focus:outline-none"
                                />
                                <button
                                    onClick={handleBrowse}
                                    className="px-5 bg-white/[0.04] text-muted-foreground/30 hover:text-foreground hover:bg-white/[0.08] transition-all flex items-center justify-center"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-8 bg-white/[0.01] border-t border-white/[0.03] flex items-center justify-center gap-12">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/10 hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClone}
                        disabled={!url || !localPath || isLoading}
                        className="flex-1 max-w-[180px] h-12 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-5 flex items-center justify-center gap-3 shadow-xl"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Clone"
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
