import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/appStore";
import { Search, CornerDownLeft, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Repository } from "@/types";

export function QuickSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const {
        repositories,
        workspaces,
        setSelectedWorkspace,
        setSelectedRepository,
        selectedRepositoryPath
    } = useAppStore();

    // Listen for the command to open/toggle
    useEffect(() => {
        const handleOpen = () => {
            setOpen((prev) => !prev);
            setQuery("");
            setSelectedIndex(0);
        };

        window.addEventListener("quick-search-open", handleOpen);
        return () => window.removeEventListener("quick-search-open", handleOpen);
    }, []);

    // Filter repositories
    const filteredRepos = useMemo(() => {
        if (!query) return repositories;
        const lowerQuery = query.toLowerCase();
        return repositories.filter(repo =>
            repo.name.toLowerCase().includes(lowerQuery) ||
            repo.path.toLowerCase().includes(lowerQuery)
        );
    }, [repositories, query]);

    // Handle selection
    const handleSelect = (repo: Repository) => {
        // Find which workspace contains this repo
        const workspace = workspaces.find(ws => ws.repositories.includes(repo.path));

        // Switch workspace if needed
        if (workspace) {
            setSelectedWorkspace(workspace.id);
        } else {
            setSelectedWorkspace("uncategorized");
        }

        setSelectedRepository(repo.path);
        setOpen(false);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredRepos.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredRepos[selectedIndex]) {
                    handleSelect(filteredRepos[selectedIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, filteredRepos, selectedIndex]);

    // Ensure selected index in view
    useEffect(() => {
        if (open && listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: "nearest" });
            }
        }
    }, [selectedIndex, open]);

    // Helper to get workspace name for a repo
    const getWorkspaceName = (repoPath: string) => {
        const ws = workspaces.find(w => w.repositories.includes(repoPath));
        return ws ? ws.name : "Uncategorized";
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent hideClose className="sm:max-w-[600px] p-0 gap-0 top-[20%] translate-y-0 overflow-hidden outline-none ring-0">
                <DialogTitle className="sr-only">Quick Open</DialogTitle>
                <div className="flex items-center px-4 py-3 border-b border-border/40">
                    <Search className="w-5 h-5 text-muted-foreground/50 mr-3" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Search repositories..."
                        className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground/40 font-medium h-8"
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">ESC</span>
                        </kbd>
                    </div>
                </div>

                <div
                    ref={listRef}
                    className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide"
                >
                    {filteredRepos.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground/40">
                            No repositories found.
                        </div>
                    ) : (
                        filteredRepos.map((repo, index) => (
                            <button
                                key={repo.path}
                                onClick={() => handleSelect(repo)}
                                className={cn(
                                    "w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors group",
                                    selectedIndex === index ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                    repo.path === selectedRepositoryPath && "bg-primary/10 text-primary"
                                )}
                            >
                                <GitBranch className={cn(
                                    "w-4 h-4 mr-3 shrink-0",
                                    selectedIndex === index ? "text-accent-foreground" : "text-muted-foreground/50"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate text-sm">
                                            {repo.name}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ml-2 shrink-0",
                                            selectedIndex === index ? "bg-background/20 text-accent-foreground/80" : "bg-muted text-muted-foreground/60"
                                        )}>
                                            {getWorkspaceName(repo.path)}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "text-xs truncate font-mono mt-0.5",
                                        selectedIndex === index ? "text-accent-foreground/60" : "text-muted-foreground/40"
                                    )}>
                                        {repo.path}
                                    </div>
                                </div>
                                {selectedIndex === index && (
                                    <CornerDownLeft className="w-4 h-4 ml-3 opacity-50 shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
                <div className="px-4 py-2 border-t border-border/40 bg-muted/20 text-[10px] text-muted-foreground/40 flex justify-between items-center">
                    <span>
                        <strong>{filteredRepos.length}</strong> repositories
                    </span>
                    <div className="flex gap-2">
                        <span>Use <strong>ARROWS</strong> to navigate</span>
                        <span><strong>ENTER</strong> to select</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
