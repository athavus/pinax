/**
 * Sidebar component with workspace and repository navigation
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { FolderGit2, Check } from "lucide-react";
import { Repository } from "@/types";
import { WorkspaceSelect } from "@/components/workspace";
import { useWorkspaceRepositories } from "@/hooks/useWorkspaceRepositories";
import { homeDir } from "@tauri-apps/api/path";

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

    // Scan for repos on mount
    useEffect(() => {
        const initScan = async () => {
            try {
                const home = await homeDir();
                scanForRepositories(home);
            } catch (err) {
                console.error("Failed to get home dir:", err);
                scanForRepositories("/home"); // Fallback
            }
        };
        initScan();
    }, [scanForRepositories]);

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <aside
                data-sidebar
                tabIndex={0}
                onFocus={() => setNavigationContext("sidebar")}
                className={cn(
                    "w-80 min-w-80 h-full flex flex-col bg-sidebar border-r border-sidebar-border/40",
                    "outline-none transition-all duration-300 rounded-none overflow-hidden m-4 shadow-2xl"
                )}
            >
                {/* Header with high impact */}
                <header className="flex flex-col gap-4 px-6 pt-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-none bg-primary text-primary-foreground shadow-[0_4px_24px_rgba(var(--primary),0.3)] animate-pulse-slow">
                            <FolderGit2 className="w-5 h-5 font-black" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-2xl tracking-tight text-foreground leading-none">Pinax</h1>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1 opacity-80">Workbench</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
                    <WorkspaceSelect />

                    {/* Repositories */}
                    <div className="px-0">
                        <div className="px-8 mt-2 mb-4 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                                Repositories
                            </h2>
                            <span className="text-[10px] font-bold text-primary/40 px-2 py-0.5 bg-primary/5 rounded-none">
                                {repositories.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            {repositories.length > 0 ? (
                                repositories.map((repo) => (
                                    <RepositoryItem
                                        key={repo.path}
                                        repository={repo}
                                        isSelected={selectedRepositoryPath === repo.path}
                                        isFocused={false}
                                        onClick={() => setSelectedRepository(repo.path)}
                                    />
                                ))
                            ) : (
                                <div className="px-8 py-10 text-center">
                                    <p className="text-xs text-muted-foreground/30 font-bold italic">No repositories in this workspace</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer with more depth */}
                <footer className="px-8 py-8 border-t border-sidebar-border/40 bg-card/40 backdrop-blur-md flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                        {repositories.length} PROJECTS
                    </span>
                    <div className="w-1.5 h-4 bg-primary rounded-none shadow-[0_0_12px_rgba(var(--primary),0.4)]" />
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
    ContextMenuPortal,
} from "@/components/ui/context-menu"

function RepositoryItem({ repository, isSelected, isFocused, onClick }: RepositoryItemProps) {
    const { workspaces, addRepositoryToWorkspace } = useAppStore();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: repository.path,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <li ref={setNodeRef} style={style} {...listeners} {...attributes} className="relative">
                    <button
                        onClick={onClick}
                        className={cn(
                            "w-full flex items-center gap-4 px-8 py-2.5 text-left outline-none transition-all duration-300 border-l-4",
                            isSelected
                                ? "bg-primary text-primary-foreground border-primary font-black shadow-lg shadow-primary/20 scale-[1.02] z-10 mx-2 w-[calc(100%-1rem)] rounded-none"
                                : "text-muted-foreground/60 border-transparent hover:bg-primary/10 hover:text-foreground hover:border-primary/30",
                            isFocused && !isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                        )}
                    >
                        <FolderGit2 className={cn(
                            "w-5 h-5 transition-all",
                            isSelected ? "opacity-100 scale-110" : "opacity-30"
                        )} />
                        <span className="text-sm truncate tracking-tight font-bold">{repository.name}</span>
                        {isSelected && (
                            <div className="ml-auto animate-in zoom-in-50 duration-500">
                                <Check className="w-5 h-5 text-primary-foreground" />
                            </div>
                        )}
                    </button>
                </li>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem>Open in Terminal</ContextMenuItem>
                <ContextMenuItem>Copy Path</ContextMenuItem>
                <ContextMenuSub>
                    <ContextMenuSubTrigger className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer">Move to Workspace</ContextMenuSubTrigger>
                    <ContextMenuPortal>
                        <ContextMenuSubContent className="min-w-[320px] max-w-[480px] bg-zinc-900 border-zinc-900 rounded-none shadow-2xl">
                            {workspaces.length === 0 ? (
                                <ContextMenuItem disabled className="py-2.5 text-xs font-bold px-4">No workspaces</ContextMenuItem>
                            ) : (
                                workspaces.map(ws => (
                                    <ContextMenuItem
                                        key={ws.id}
                                        onClick={() => addRepositoryToWorkspace(ws.id, repository.path)}
                                        className="py-2.5 text-xs font-mono font-bold cursor-pointer truncate px-4"
                                    >
                                        {ws.name}
                                    </ContextMenuItem>
                                ))
                            )}
                        </ContextMenuSubContent>
                    </ContextMenuPortal>
                </ContextMenuSub>
            </ContextMenuContent>
        </ContextMenu>
    );
}
