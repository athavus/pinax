import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { useWorkspaceRepositories } from "@/hooks/useWorkspaceRepositories";
import {
    ChevronDown,
    Briefcase,
    FolderOpen,
    Plus,
    LayoutGrid,
    Check
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogTrigger
} from "@/components/ui/dialog";

export function WorkspaceSelect() {
    const {
        workspaces,
        selectedWorkspaceId,
        setSelectedWorkspace,
        createWorkspace,
        isLoading
    } = useAppStore();

    const [isOpen, setIsOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
    const repositories = useWorkspaceRepositories();

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newWorkspaceName.trim()) {
            await createWorkspace(newWorkspaceName.trim());
            setNewWorkspaceName("");
            setIsCreateDialogOpen(false);
            setIsOpen(false);
        }
    };

    const handleSelect = (id: string | null) => {
        setSelectedWorkspace(id);
        setIsOpen(false);
    };

    return (
        <div className="px-6 mb-8 relative" ref={dropdownRef}>
            <h2 className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] mb-4 px-2">
                Workspace
            </h2>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 rounded-none transition-all duration-300 hover:bg-primary/15 hover:border-primary/20 text-left shadow-sm group active:scale-[0.98]",
                        isOpen && "ring-2 ring-primary/20 border-primary/30 bg-primary/20 shadow-lg shadow-primary/5"
                    )}
                >
                    <div className="p-2.5 rounded-none bg-primary/20 text-primary shadow-sm group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-500 ring-4 ring-primary/5">
                        {selectedWorkspaceId === "uncategorized" ? <FolderOpen className="w-4 h-4" /> :
                            !selectedWorkspaceId || selectedWorkspaceId === "all" ? <LayoutGrid className="w-4 h-4" /> :
                                <Briefcase className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                        <span className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                            {selectedWorkspaceId === "uncategorized" ? "Uncategorized" :
                                !selectedWorkspaceId || selectedWorkspaceId === "all" ? "All Repositories" :
                                    selectedWorkspace?.name || "Select Workspace"}
                        </span>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">
                            {repositories.length} {repositories.length === 1 ? 'Repository' : 'Repositories'}
                        </span>
                    </div>
                    <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-all duration-300",
                        isOpen && "rotate-180 text-primary"
                    )} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-6 right-6 z-50 bg-popover/95 backdrop-blur-2xl border border-border/20 p-2 rounded-none shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-none outline-none transition-all",
                                (!selectedWorkspaceId || selectedWorkspaceId === "all") ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                            )}
                            onClick={() => handleSelect(null)}
                        >
                            <LayoutGrid className="w-4 h-4 opacity-60" />
                            <span className="flex-1 text-left">All Repositories</span>
                            {(!selectedWorkspaceId || selectedWorkspaceId === "all") && <Check className="w-4 h-4" />}
                        </button>

                        <button
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-none outline-none transition-all mt-1",
                                selectedWorkspaceId === "uncategorized" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                            )}
                            onClick={() => handleSelect("uncategorized")}
                        >
                            <FolderOpen className="w-4 h-4 opacity-60" />
                            <span className="flex-1 text-left">Uncategorized</span>
                            {selectedWorkspaceId === "uncategorized" && <Check className="w-4 h-4" />}
                        </button>

                        <div className="h-px bg-border/20 my-2 mx-2" />

                        <div className="px-3 py-1.5 mb-1">
                            <span className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-[0.2em]">Custom Workspaces</span>
                        </div>

                        <div className="max-h-[240px] overflow-y-auto space-y-1 p-0.5">
                            {workspaces.length > 0 ? (
                                workspaces.map((workspace) => (
                                    <button
                                        key={workspace.id}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-none outline-none transition-all",
                                            selectedWorkspaceId === workspace.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                                        )}
                                        onClick={() => handleSelect(workspace.id)}
                                    >
                                        <Briefcase className="w-4 h-4 opacity-60" />
                                        <span className="flex-1 truncate text-left">{workspace.name}</span>
                                        {selectedWorkspaceId === workspace.id && <Check className="w-4 h-4" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-4 text-center">
                                    <span className="text-[10px] text-muted-foreground/20 italic font-medium">No custom workspaces</span>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-border/20 my-2 mx-2" />

                        <DialogTrigger asChild>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-primary hover:bg-primary/10 rounded-none outline-none transition-all uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" />
                                New Workspace
                            </button>
                        </DialogTrigger>
                    </div>
                )}

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Workspace</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-6 pt-6">
                        <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Workspace Name</label>
                            <input
                                autoFocus
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="e.g. Frontend, Tools, Personal"
                                className="w-full px-5 py-4 rounded-none bg-background border border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/20 text-base font-bold shadow-inner"
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <button type="button" className="px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                                    Cancel
                                </button>
                            </DialogClose>
                            <button
                                type="submit"
                                disabled={!newWorkspaceName.trim() || isLoading}
                                className="px-8 py-3 bg-primary text-primary-foreground text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:brightness-110 disabled:opacity-50 transition-all rounded-none"
                            >
                                Create
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
