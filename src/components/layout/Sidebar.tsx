/**
 * Sidebar component with workspace and repository navigation
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { FolderGit2, ChevronRight, FolderOpen } from "lucide-react";
import type { Repository } from "@/types";
import { WorkspaceList } from "@/components/workspace";
import { useWorkspaceRepositories } from "@/hooks/useWorkspaceRepositories";
import { CreateRepoDialog } from "@/components/github";

import { useDraggable, DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";

export function Sidebar() {
    const {
        selectedRepositoryPath,
        setSelectedRepository,
        setNavigationContext,
        navigationContext,
        scanForRepositories,
        addRepositoryToWorkspace
    } = useAppStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            // active.id is repo path, over.id is workspace id
            addRepositoryToWorkspace(over.id as string, active.id as string);
        }
    };

    // Filter repos by workspace
    const repositories = useWorkspaceRepositories();

    const [focusedIndex, setFocusedIndex] = useState(0);

    // Handle vim-style navigation
    useEffect(() => {
        const handleNavigate = (e: CustomEvent<"up" | "down">) => {
            if (navigationContext !== "sidebar") return;

            setFocusedIndex((prev) => {
                if (e.detail === "down") {
                    return Math.min(prev + 1, repositories.length - 1);
                } else {
                    return Math.max(prev - 1, 0);
                }
            });
        };

        const handleSelect = () => {
            if (navigationContext !== "sidebar") return;
            if (repositories[focusedIndex]) {
                setSelectedRepository(repositories[focusedIndex].path);
            }
        };

        window.addEventListener("pinax:navigate", handleNavigate as EventListener);
        window.addEventListener("pinax:select", handleSelect);

        return () => {
            window.removeEventListener("pinax:navigate", handleNavigate as EventListener);
            window.removeEventListener("pinax:select", handleSelect);
        };
    }, [navigationContext, focusedIndex, repositories, setSelectedRepository]);

    // Scan for repos on mount - path will be configurable in the future
    useEffect(() => {
        // TODO: Get actual home directory from Tauri backend
        const homeDir = "/home";
        scanForRepositories(homeDir);
    }, [scanForRepositories]);

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <aside
                data-sidebar
                tabIndex={0}
                onFocus={() => setNavigationContext("sidebar")}
                className={cn(
                    "w-72 min-w-72 h-full flex flex-col bg-card rounded-xl shadow-sm",
                    "outline-none focus:ring-2 ring-primary/20 transition-shadow"
                )}
            >
                {/* Header */}
                <header className="flex items-center gap-3 px-8 py-6 border-b border-border/50">
                    <FolderGit2 className="w-5 h-5 text-primary" />
                    <h1 className="font-semibold text-lg tracking-tight">Pinax</h1>
                </header>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-6">
                        <WorkspaceList />
                    </div>

                    {/* Repositories */}
                    <div className="px-4">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <h2 className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                Repositories
                            </h2>
                            <CreateRepoDialog />
                        </div>

                        {repositories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-[hsl(var(--muted-foreground))]">
                                <FolderOpen className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-sm">No repositories found</p>
                                <p className="text-xs mt-1">Press ⌘P to scan a directory</p>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {repositories.map((repo, index) => (
                                    <RepositoryItem
                                        key={repo.path}
                                        repository={repo}
                                        isSelected={selectedRepositoryPath === repo.path}
                                        isFocused={navigationContext === "sidebar" && focusedIndex === index}
                                        onClick={() => setSelectedRepository(repo.path)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="px-4 py-3 border-t border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {repositories.length} repositories
                    </p>
                </footer>
            </aside>
        </DndContext>
    );
}

interface RepositoryItemProps {
    repository: Repository;
    isSelected: boolean;
    isFocused: boolean;
    onClick: () => void;
}

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

function RepositoryItem({ repository, isSelected, isFocused, onClick }: RepositoryItemProps) {
    const { workspaces, addRepositoryToWorkspace } = useAppStore();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: repository.path,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <li ref={setNodeRef} style={style} {...listeners} {...attributes}>
                    <button
                        onClick={onClick}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left outline-none",
                            "transition-all duration-200",
                            isSelected
                                ? "bg-accent text-accent-foreground font-medium shadow-sm translate-x-1"
                                : isFocused
                                    ? "bg-muted"
                                    : "hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:translate-x-0.5"
                        )}
                    >
                        <FolderGit2 className="w-4 h-4 shrink-0 opacity-70" />
                        <span className="text-sm truncate font-medium">{repository.name}</span>
                        {isSelected && <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-50" />}
                    </button>
                </li>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem>Open in Terminal</ContextMenuItem>
                <ContextMenuItem>Copy Path</ContextMenuItem>
                <ContextMenuSub>
                    <ContextMenuSubTrigger>Move to Workspace</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                        {workspaces.length === 0 ? (
                            <ContextMenuItem disabled>No workspaces</ContextMenuItem>
                        ) : (
                            workspaces.map(ws => (
                                <ContextMenuItem
                                    key={ws.id}
                                    onClick={() => addRepositoryToWorkspace(ws.id, repository.path)}
                                >
                                    {ws.name}
                                </ContextMenuItem>
                            ))
                        )}
                    </ContextMenuSubContent>
                </ContextMenuSub>
            </ContextMenuContent>
        </ContextMenu>
    );
}
