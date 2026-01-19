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
                    "w-80 min-w-80 h-full flex flex-col bg-sidebar border-r border-sidebar-border",
                    "outline-none transition-all duration-300 rounded-2xl overflow-hidden m-4 shadow-2xl"
                )}
            >
                {/* Header with high impact */}
                <header className="flex flex-col gap-6 px-8 py-14">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_32px_rgba(var(--primary),0.3)] animate-pulse-slow">
                            <FolderGit2 className="w-8 h-8 font-black" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-black text-5xl tracking-tighter text-foreground leading-none">Pinax</h1>
                            <span className="text-xs font-black uppercase tracking-[0.5em] text-primary mt-4 opacity-100">Workbench</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
                    <WorkspaceSelect />

                    {/* Repositories */}
                    <div className="px-0">
                        <div className="px-8 mb-6 flex items-center justify-between">
                            <h2 className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">
                                Repositories
                            </h2>
                            <span className="text-[10px] font-black text-primary/40 px-2 py-0.5 bg-primary/5 rounded-full">
                                {repositories.length}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
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
                <footer className="px-8 py-8 border-t border-sidebar-border bg-card/40 backdrop-blur-md flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                        {repositories.length} PROJECTS
                    </span>
                    <div className="w-1.5 h-4 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.4)]" />
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
        zIndex: 50,
    } : undefined;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <li ref={setNodeRef} style={style} {...listeners} {...attributes} className="relative">
                    <button
                        onClick={onClick}
                        className={cn(
                            "w-full flex items-center gap-5 px-8 py-5 text-left outline-none transition-all duration-300 border-l-4",
                            isSelected
                                ? "bg-primary text-primary-foreground border-primary font-black shadow-lg shadow-primary/20 scale-[1.02] z-10 mx-2 w-[calc(100%-1rem)] rounded-2xl"
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
