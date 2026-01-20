/**
 * Sidebar component with workspace and repository navigation
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { Repository } from "@/types";
import { WorkspaceSelect } from "@/components/workspace";
import { useWorkspaceRepositories } from "@/hooks/useWorkspaceRepositories";
import { homeDir } from "@tauri-apps/api/path";
import { CreateRepoModal } from "@/components/modals/CreateRepoModal";
import { CloneRepoModal } from "@/components/modals/CloneRepoModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Globe, HardDrive, Plus, FolderGit2, Check, Settings } from "lucide-react";
import logo from "@/assets/whitelogo.png";
import { useDraggable, DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";

export function Sidebar() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const {
        selectedRepositoryPath,
        setSelectedRepository,
        scanForRepositories,
        addRepositoryToWorkspace,
        addLocalRepository
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
                className={cn(
                    "w-80 min-w-80 h-full flex flex-col bg-sidebar border-r border-sidebar-border/40",
                    "outline-none transition-all duration-300 rounded-none overflow-hidden m-4 shadow-2xl"
                )}
            >
                <header className="flex flex-col gap-4 px-6 pt-8 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-none bg-primary/5 flex items-center justify-center overflow-hidden">
                                <img src={logo} alt="pinax logo" className="w-12 h-12 object-contain" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="font-bold text-2xl tracking-tighter text-foreground leading-none">pinax</h1>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mt-1 opacity-80 leading-none">git-workbench</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-muted-foreground/20 hover:text-primary transition-all group"
                        >
                            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
                    <WorkspaceSelect />

                    {/* Repositories */}
                    <div className="px-0">
                        <div className="px-8 mt-2 mb-4 flex items-center justify-between relative">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                                    Repositories
                                </h2>
                                <span className="text-[10px] font-bold text-primary/40 px-2 py-0.5 bg-primary/5 rounded-none">
                                    {repositories.length}
                                </span>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-1.5 rounded-none hover:bg-primary/10 text-muted-foreground/40 hover:text-primary transition-all group"
                                    title="Repository Actions"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-3 w-64 bg-card border-none rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-3xl overflow-hidden ring-0 outline-none">
                                            <button
                                                onClick={() => {
                                                    setIsCreateModalOpen(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-4 py-5 px-6 text-muted-foreground/30 hover:text-foreground hover:bg-white/[0.04] transition-all text-left group border-none ring-0 outline-none"
                                            >
                                                <Plus className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Project</span>
                                                    <span className="text-[9px] opacity-20 font-black uppercase tracking-[0.2em]">Initialize Repo</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsCloneModalOpen(true);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-4 py-5 px-6 text-muted-foreground/30 hover:text-foreground hover:bg-white/[0.04] transition-all text-left group border-none ring-0 outline-none"
                                            >
                                                <Globe className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clone Repo</span>
                                                    <span className="text-[9px] opacity-20 font-black uppercase tracking-[0.2em]">Download remote</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setIsMenuOpen(false);
                                                    const selected = await open({
                                                        directory: true,
                                                        multiple: false,
                                                        title: "Add Existing Repository"
                                                    });
                                                    if (selected) {
                                                        await addLocalRepository(selected as string);
                                                    }
                                                }}
                                                className="w-full flex items-center gap-4 py-5 px-6 text-muted-foreground/30 hover:text-foreground hover:bg-white/[0.04] transition-all text-left group border-none ring-0 outline-none"
                                            >
                                                <HardDrive className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Existing</span>
                                                    <span className="text-[9px] opacity-20 font-black uppercase tracking-[0.2em]">Link local folder</span>
                                                </div>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
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
            <CreateRepoModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
            <CloneRepoModal open={isCloneModalOpen} onOpenChange={setIsCloneModalOpen} />
            <SettingsModal
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
            />
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
    const { workspaces, addRepositoryToWorkspace, settings: appSettings } = useAppStore();
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
            <ContextMenuContent className="w-56 bg-zinc-900 border-border rounded-none shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100">
                <ContextMenuItem
                    onClick={async () => {
                        try {
                            // Using standard browser clipboard API
                            await navigator.clipboard.writeText(repository.path);
                        } catch (err) {
                            console.error("Failed to copy path:", err);
                        }
                    }}
                    className="flex items-center gap-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4"
                >
                    Copy Path
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => {
                        // In Linux, we can often use xdg-open to open a terminal or a script
                        // But usually Tauri Shell is better if configured. 
                        // For now we'll call a hypothetical backend command or use standard tauri shell if available
                        invoke("open_terminal", { path: repository.path }).catch(console.error);
                    }}
                    className="flex items-center gap-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4"
                >
                    Open in Terminal
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => {
                        invoke("open_in_editor", {
                            path: repository.path,
                            preferredEditor: appSettings.preferredEditor
                        }).catch(console.error);
                    }}
                    className="flex items-center gap-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4"
                >
                    Open in Editor
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => {
                        invoke("open_file_manager", { path: repository.path }).catch(console.error);
                    }}
                    className="flex items-center gap-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4"
                >
                    Open in File Manager
                </ContextMenuItem>
                <div className="h-px bg-white/5 my-1.5" />
                <ContextMenuSub>
                    <ContextMenuSubTrigger className="flex items-center gap-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-4">
                        Move to Workspace
                    </ContextMenuSubTrigger>
                    <ContextMenuPortal>
                        <ContextMenuSubContent className="min-w-[240px] bg-zinc-900 border-border rounded-none shadow-2xl p-1.5">
                            {workspaces.length === 0 ? (
                                <ContextMenuItem disabled className="py-2.5 text-[11px] font-black uppercase tracking-widest px-4 opacity-20">No workspaces</ContextMenuItem>
                            ) : (
                                workspaces.map(ws => (
                                    <ContextMenuItem
                                        key={ws.id}
                                        onClick={() => addRepositoryToWorkspace(ws.id, repository.path)}
                                        className="py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer truncate px-4 hover:bg-primary hover:text-primary-foreground"
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
