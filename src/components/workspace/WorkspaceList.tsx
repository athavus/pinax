/**
 * Workspace management components
 */

import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { Plus, Briefcase, Folder, FolderOpen, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

import { useDroppable } from "@dnd-kit/core";

export function WorkspaceList() {
    const {
        workspaces,
        selectedWorkspaceId,
        setSelectedWorkspace,
    } = useAppStore();

    return (
        <section className="flex flex-col gap-4 px-8 py-6 border-b border-border/10">
            <h2 className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-3 px-1">
                Workspaces
            </h2>

            <div className="space-y-[2px]">
                <button
                    onClick={() => setSelectedWorkspace(null)}
                    className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 text-left text-sm transition-all border-l-4 rounded-xl",
                        !selectedWorkspaceId || selectedWorkspaceId === "all"
                            ? "bg-primary/20 border-primary text-primary font-black shadow-sm"
                            : "border-transparent hover:bg-primary/10 text-muted-foreground/60 hover:text-foreground"
                    )}
                >
                    <Folder className="w-4 h-4 opacity-50" />
                    <span className="truncate">All Repositories</span>
                </button>

                <button
                    onClick={() => setSelectedWorkspace("uncategorized")}
                    className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 text-left text-sm transition-all border-l-4 rounded-xl",
                        selectedWorkspaceId === "uncategorized"
                            ? "bg-primary/20 border-primary text-primary font-black shadow-sm"
                            : "border-transparent hover:bg-primary/10 text-muted-foreground/60 hover:text-foreground"
                    )}
                >
                    <FolderOpen className="w-4 h-4 opacity-50" />
                    <span className="truncate">Uncategorized</span>
                </button>

                {workspaces.map((ws) => (
                    <WorkspaceDroppableItem
                        key={ws.id}
                        workspace={ws}
                        isSelected={selectedWorkspaceId === ws.id}
                        onSelect={() => setSelectedWorkspace(ws.id)}
                    />
                ))}
            </div>

            <div className="mt-2">
                <CreateWorkspaceDialog />
            </div>
        </section>
    );
}

interface WorkspaceDroppableItemProps {
    workspace: { id: string; name: string };
    isSelected: boolean;
    onSelect: () => void;
}

function WorkspaceDroppableItem({ workspace, isSelected, onSelect }: WorkspaceDroppableItemProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: workspace.id,
    });

    return (
        <div className="group flex items-center w-full">
            <button
                ref={setNodeRef}
                onClick={onSelect}
                className={cn(
                    "flex-1 flex items-center gap-4 px-4 py-3 text-left text-sm transition-all border-l-4 rounded-xl",
                    isSelected
                        ? "bg-primary/20 border-primary text-primary font-black shadow-sm"
                        : isOver
                            ? "bg-primary/30 border-primary text-primary scale-[1.02] shadow-md"
                            : "border-transparent hover:bg-primary/10 text-muted-foreground/60 hover:text-foreground"
                )}
            >
                <Briefcase className="w-4 h-4 opacity-50" />
                <span className="truncate">{workspace.name}</span>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    useAppStore.getState().deleteWorkspace(workspace.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground/40 hover:text-destructive transition-all"
                title="Delete Workspace"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function CreateWorkspaceDialog() {
    const { createWorkspace } = useAppStore();
    const [name, setName] = useState("");
    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            await createWorkspace(name.trim());
            setName("");
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground text-sm font-bold hover:brightness-110 shadow-md transition-all rounded-xl border border-primary/10">
                    <Plus className="w-4 h-4" />
                    New Workspace
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                    <div className="space-y-3">
                        <label className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Workspace Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Web, Embedded, Tools"
                            className="w-full px-5 py-3.5 rounded-xl bg-background border border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/20 text-base font-medium shadow-inner transition-all"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-8 py-3 bg-primary text-primary-foreground text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:brightness-110 disabled:opacity-50 transition-all rounded-xl"
                        >
                            Create
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
