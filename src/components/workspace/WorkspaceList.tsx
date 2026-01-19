/**
 * Workspace management components
 */

import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { Plus, Briefcase, Folder, Trash2 } from "lucide-react";
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
        <section className="flex flex-col gap-3 p-4 border-b border-border/50">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Workspaces
            </h2>

            <div className="space-y-1">
                <button
                    onClick={() => setSelectedWorkspace(null)}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left text-sm transition-all",
                        !selectedWorkspaceId
                            ? "bg-primary text-primary-foreground font-medium shadow-md scale-[1.02]"
                            : "hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:translate-x-1"
                    )}
                >
                    <Folder className="w-5 h-5" />
                    <span className="truncate font-medium">All Repositories</span>
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

            <CreateWorkspaceDialog />
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
        <div className="group flex items-center gap-1 w-full">
            <button
                ref={setNodeRef}
                onClick={onSelect}
                className={cn(
                    "flex-1 flex items-center gap-3 px-4 py-3.5 rounded-lg text-left text-sm transition-all",
                    isSelected
                        ? "bg-primary text-primary-foreground font-medium shadow-md scale-[1.02]"
                        : isOver
                            ? "bg-accent text-accent-foreground ring-2 ring-primary scale-105"
                            : "hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:translate-x-1"
                )}
            >
                <Briefcase className="w-5 h-5" />
                <span className="truncate font-medium">{workspace.name}</span>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    useAppStore.getState().deleteWorkspace(workspace.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                title="Delete Workspace"
            >
                <Trash2 className="w-4 h-4" />
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
                <button className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-2 py-1 transition-colors">
                    <Plus className="w-3 h-3" />
                    New Workspace
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Web, Embedded, Tools"
                            className="w-full px-3 py-2 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--accent))] rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-3 py-2 text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md disabled:opacity-50 transition-colors"
                        >
                            Create
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
