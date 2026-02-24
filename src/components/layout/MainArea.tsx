/**
 * Main content area displaying selected repository status
 */

import React, { useRef, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
// import { open } from "@tauri-apps/plugin-opener";
import {
    GitBranch,
    Check,
    FileText,
    RefreshCw,
    Upload,
    ArrowDown,
    ChevronDown,
    Trash2,
    EyeOff,
    Copy,
    CornerUpLeft,
    History,
    GitBranchPlus,
    GitCommitVertical,
    ExternalLink,
    Zap,
} from "lucide-react";
import { md5 } from "@/lib/md5";
import { WelcomeView } from "./WelcomeView";
import { MergeConflictModal } from "@/components/modals/MergeConflictModal";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuPortal,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function MainArea() {
    const commitInputRef = useRef<HTMLTextAreaElement>(null);
    const {
        selectedRepositoryPath,
        repositoryStatus,
        repositories,
        isLoading,
        branches,
        commits,
        selectedFile,
        selectedFileDiff,
        fetch,
        pull,
        push,
        commit,
        checkout,
        setSelectedFile,
        isFetching,
        isPulling,
        isPushing,
        error,
        clearError,
        undoCommit,
        resolveConflict,
        discardChanges,
        addToGitignore,
        createBranchFromCommit,
        checkoutCommit,
        revertCommit,
        resetToCommit,
        cherryPickCommit,
        selectedCommitHash,
        selectedCommitFiles,
        loadCommitFiles,
        stageFile,
        unstageFile,
        stageAll,
        unstageAll,
        setupGithubAuth,
        mergeConflictModalOpen,
        setMergeConflictModalOpen,
    } = useAppStore();

    const [commitMessage, setCommitMessage] = React.useState("");
    const [isCommitted, setIsCommitted] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"changes" | "history">("changes");
    const [branchSelectorOpen, setBranchSelectorOpen] = React.useState(false);
    const [branchFilter, setBranchFilter] = React.useState("");

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;
        await commit(commitMessage);
        setCommitMessage("");
        setIsCommitted(true);
        setTimeout(() => setIsCommitted(false), 3000);
    };

    const handleBranchSwitch = async (branchName: string) => {
        console.log("Switching to branch:", branchName);
        await checkout(branchName);
        setBranchSelectorOpen(false);
        setBranchFilter("");
    };

    const selectedRepo = repositories.find((r) => r.path === selectedRepositoryPath);

    // Deduplicate branches: if we have "main" and "origin/main", we only show "main"
    // We prioritize local branches and show remotes only if they don't have a local counterpart
    const deduplicatedBranches = React.useMemo(() => {
        const locals = branches.filter(b => !b.is_remote);
        const remotes = branches.filter(b => b.is_remote);

        const filteredRemotes = remotes.filter(remote => {
            // Check if there is a local branch with the same name
            // The remote name might be "origin/branch-name", we need to check the suffix
            // Usually remotes have the full name, but we can check if any local matches the "short" name
            const shortName = remote.name.split("/").slice(1).join("/");
            return !locals.some(local => local.name === shortName || local.name === remote.name);
        });

        return [...locals, ...filteredRemotes];
    }, [branches]);

    const filteredBranches = deduplicatedBranches.filter(b =>
        b.name.toLowerCase().includes(branchFilter.toLowerCase())
    );

    const defaultBranch = deduplicatedBranches.find(b => b.name === "main" || b.name === "master");
    const otherBranches = filteredBranches.filter(b => b.name !== (defaultBranch?.name || ""));


    // Cache for GitHub avatar URLs by commit hash
    const [avatarCache, setAvatarCache] = React.useState<Map<string, string>>(new Map());

    const getAvatarUrl = React.useCallback((commitHash: string, fallbackEmail: string) => {
        // Check if we have a cached avatar URL for this commit
        const cachedAvatarUrl = avatarCache.get(commitHash);
        if (cachedAvatarUrl) {
            return cachedAvatarUrl;
        }

        // Fallback to Gravatar while loading
        const cleanEmail = fallbackEmail.trim().toLowerCase();
        return `https://www.gravatar.com/avatar/${md5(cleanEmail)}?d=identicon&s=64`;
    }, [avatarCache]);

    // Resolve GitHub avatar URLs using backend command (uses GitHub Commits API)
    React.useEffect(() => {
        const resolveGithubAvatars = async () => {
            // Need remote URL to fetch from GitHub API
            if (!selectedRepo?.remote_url) return;

            const hashesToResolve: string[] = [];

            commits.forEach(commit => {
                // Skip if already cached
                if (avatarCache.has(commit.hash)) return;

                if (!hashesToResolve.includes(commit.hash)) {
                    hashesToResolve.push(commit.hash);
                }
            });

            if (hashesToResolve.length === 0) return;

            try {
                // Call Tauri backend to fetch avatars using GitHub Commits API
                const { invoke } = await import("@tauri-apps/api/core");
                const avatars = await invoke<Record<string, string>>("get_github_avatars", {
                    remoteUrl: selectedRepo.remote_url,
                    commitHashes: hashesToResolve
                });

                // Update cache with new avatars
                const newCache = new Map(avatarCache);
                for (const [hash, avatarUrl] of Object.entries(avatars)) {
                    newCache.set(hash, avatarUrl);
                }
                setAvatarCache(newCache);
            } catch (error) {
                console.error('Failed to resolve GitHub avatars:', error);
            }
        };

        resolveGithubAvatars();
    }, [commits, selectedRepo?.remote_url]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-focus commit message input when repository changes
    useEffect(() => {
        if (selectedRepositoryPath && commitInputRef.current) {
            // Small timeout to ensure the component is fully rendered and visible
            const timer = setTimeout(() => {
                commitInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedRepositoryPath]);

    if (!selectedRepositoryPath || !selectedRepo) {
        return (
            <main className="flex-1 flex flex-col bg-background/80 backdrop-blur-3xl overflow-hidden border border-border/40 rounded-none shadow-2xl">
                <WelcomeView />
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-background/40 backdrop-blur-3xl overflow-hidden border border-border/10 rounded-none shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] animate-in fade-in duration-500 relative">
            {/* Global Error Notification */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-destructive/10 backdrop-blur-xl border border-destructive/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl">
                        <div className="p-2 rounded-xl bg-destructive/20 text-destructive">
                            <RefreshCw className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-destructive/90">{error}</span>
                        {typeof error === "string" && (error.includes("terminal prompts disabled") || error.includes("Username") || error.includes("authentication")) && (
                            <button
                                onClick={setupGithubAuth}
                                className="px-3 py-1 bg-destructive/20 hover:bg-destructive/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-destructive transition-all border border-destructive/20"
                            >
                                Fix Auth
                            </button>
                        )}
                        <button
                            onClick={clearError}
                            className="ml-2 p-1 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header with Glassmorphism */}
            <header className="flex flex-col border-b border-border/10 bg-card/40 backdrop-blur-md">
                <div className="flex items-center h-16 px-4 md:px-6 gap-3 md:gap-4 lg:gap-6">
                    {/* Repository Indicator */}
                    <div className="flex items-center gap-3 py-2 px-2 md:px-4 max-w-[140px] md:max-w-[200px] shrink group/repo min-w-0">
                        <div className="p-2 rounded-none bg-primary/5 text-primary/40 group-hover/repo:bg-primary/20 group-hover/repo:text-primary transition-all duration-300 ring-1 ring-primary/5 shrink-0 hidden sm:flex">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground/70 leading-none mb-1.5 tracking-[0.1em] hidden lg:block">Repository</span>
                            <span className="text-sm font-bold truncate text-foreground group-hover/repo:text-foreground transition-colors">{selectedRepo.name}</span>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-border/20" />

                    {/* Branch Selector with Dropdown */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setBranchSelectorOpen(!branchSelectorOpen)}
                            className={cn(
                                "flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2.5 bg-primary/10 border border-transparent hover:bg-primary/20 transition-all rounded-xl group",
                                branchSelectorOpen && "ring-2 ring-primary/30 bg-primary/20"
                            )}
                        >
                            <GitBranch className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                            <span className="text-sm font-black text-foreground">{repositoryStatus?.branch || "main"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform hidden md:block", branchSelectorOpen && "rotate-180")} />
                        </button>

                        <Dialog open={branchSelectorOpen} onOpenChange={setBranchSelectorOpen}>
                            <DialogContent className="max-w-xl p-0 overflow-hidden border-border shadow-2xl rounded-3xl">
                                <DialogHeader className="p-6 border-b border-border/10 bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                            <GitBranch className="w-5 h-5" />
                                        </div>
                                        <DialogTitle className="text-xl font-black text-foreground">
                                            Switch Branch
                                        </DialogTitle>
                                    </div>
                                </DialogHeader>

                                {/* Tabs (Branches / Pull Requests) */}
                                <div className="flex border-b border-border/10 bg-muted/40 h-12">
                                    <button className="flex-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary border-b-2 border-primary">Branches</button>
                                    <button className="flex-1 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-foreground/80 transition-colors">Pull requests <span className="ml-1 opacity-50">0</span></button>
                                </div>

                                {/* Search and New Branch */}
                                <div className="p-4 border-b border-border/10 flex gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                                            <RefreshCw className="w-4 h-4" />
                                        </div>
                                        <input
                                            autoFocus
                                            value={branchFilter}
                                            onChange={(e) => setBranchFilter(e.target.value)}
                                            placeholder="Filter branches"
                                            className="w-full bg-background/50 border border-border/40 py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary/60 rounded-none placeholder:text-muted-foreground/30 shadow-inner"
                                        />
                                    </div>
                                    <button
                                        className="px-4 py-2.5 bg-secondary text-secondary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all rounded-none"
                                        onClick={() => {/* TODO: Open create branch dialog */ }}
                                    >
                                        New branch
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto max-h-[400px]">
                                    {/* Default Branch */}
                                    {defaultBranch && (!branchFilter || defaultBranch.name.toLowerCase().includes(branchFilter.toLowerCase())) && (
                                        <div className="py-3">
                                            <div className="px-5 py-1.5">
                                                <span className="text-[10px] font-black uppercase text-secondary-foreground/70 tracking-[0.2em]">Default branch</span>
                                            </div>
                                            <button
                                                onClick={() => handleBranchSwitch(defaultBranch.name)}
                                                className={cn(
                                                    "w-full flex items-center gap-4 px-5 py-3 text-sm font-bold text-left transition-all",
                                                    defaultBranch.is_current
                                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 mx-2 w-[calc(100%-1rem)] rounded-none"
                                                        : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <GitBranch className="w-4 h-4 opacity-50" />
                                                <span className="truncate flex-1">{defaultBranch.name}</span>
                                                {defaultBranch.is_current && <Check className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}

                                    {/* Other Branches */}
                                    <div className="py-3">
                                        <div className="px-5 py-1.5">
                                            <span className="text-[10px] font-black uppercase text-secondary-foreground/70 tracking-[0.2em]">Other branches</span>
                                        </div>
                                        {otherBranches.length > 0 ? (
                                            <div className="px-2 space-y-1">
                                                {otherBranches.map((branch) => (
                                                    <button
                                                        key={branch.name}
                                                        onClick={() => handleBranchSwitch(branch.name)}
                                                        className={cn(
                                                            "w-full flex items-center gap-4 px-4 py-3 text-sm font-medium text-left transition-all rounded-none",
                                                            branch.is_current
                                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                                : "hover:bg-primary/5 text-muted-foreground/80 hover:text-foreground"
                                                        )}
                                                    >
                                                        <GitBranch className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                                        <span className="truncate flex-1">{branch.name}</span>
                                                        {branch.is_current && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-5 py-6 text-center text-muted-foreground/30 text-xs italic font-medium">
                                                No branches matching filter
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 border-t border-border/10 bg-muted/40">
                                    <button className="w-full flex items-center justify-center gap-3 py-3 border border-border/40 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary/10 hover:border-primary/40 transition-all rounded-xl text-primary/80">
                                        <GitBranch className="w-4 h-4" />
                                        Merge into <strong>{repositoryStatus?.branch || "main"}</strong>
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="w-px h-6 bg-border/20" />

                    {/* Git Actions */}
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <button
                            onClick={fetch}
                            disabled={isFetching}
                            className={cn(
                                "px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all border border-border/20 hover:bg-accent active:bg-accent/80 disabled:opacity-50 flex items-center gap-2 group relative overflow-hidden rounded-xl",
                                isFetching && "animate-pulse"
                            )}
                        >
                            <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} />
                            <span className="hidden lg:inline">Fetch</span>
                        </button>
                        <button
                            onClick={pull}
                            disabled={isPulling}
                            className={cn(
                                "px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all border border-border/20 hover:bg-accent active:bg-accent/80 disabled:opacity-50 flex items-center gap-2 group relative overflow-hidden rounded-xl",
                                isPulling && "animate-pulse"
                            )}
                        >
                            <ArrowDown className={cn("w-3 h-3", isPulling && "animate-bounce")} />
                            <span className="hidden lg:inline">Pull</span>
                            {repositoryStatus && repositoryStatus.behind > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-[9px] font-black">
                                    {repositoryStatus.behind}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={push}
                            disabled={isPushing}
                            className={cn(
                                "px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all border border-border/20 hover:bg-accent active:bg-accent/80 disabled:opacity-50 flex items-center gap-2 group relative overflow-hidden rounded-xl",
                                isPushing && "animate-pulse"
                            )}
                        >
                            <Upload className={cn("w-3 h-3", isPushing && "animate-bounce")} />
                            <span className="hidden lg:inline">Push</span>
                            {repositoryStatus && repositoryStatus.ahead > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[9px] font-black">
                                    {repositoryStatus.ahead}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area: Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: File List & Commit */}
                <div className="w-80 border-r border-border/10 flex flex-col bg-card">
                    {/* Integrated Tabs */}
                    <div className="flex border-b border-border/5 bg-background/50">
                        <button
                            onClick={() => setActiveTab("changes")}
                            className={cn(
                                "flex-1 px-4 h-14 text-[10px] uppercase font-black tracking-[0.2em] border-b-2 transition-all",
                                activeTab === "changes"
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50"
                            )}
                        >
                            Changes
                            {repositoryStatus && (repositoryStatus.staged.length + repositoryStatus.unstaged.length + repositoryStatus.untracked.length) > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-[9px] font-black">
                                    {repositoryStatus.staged.length + repositoryStatus.unstaged.length + repositoryStatus.untracked.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={cn(
                                "flex-1 px-4 h-14 text-[10px] uppercase font-black tracking-[0.2em] border-b-2 transition-all",
                                activeTab === "history"
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50"
                            )}
                        >
                            History
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading && !selectedFile ? (
                            <div className="p-8 text-center text-muted-foreground/30 text-[9px] uppercase tracking-widest font-black py-20">Loading...</div>
                        ) : activeTab === "changes" ? (
                            <div className="p-3 space-y-6">
                                {repositoryStatus && (
                                    <>
                                        <FileList title="Conflicts" files={repositoryStatus.conflicts} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} onToggleStage={async (file) => {
                                            if (repositoryStatus.staged.some(s => s.path === file.path)) {
                                                await unstageFile(file.path);
                                            } else {
                                                await stageFile(file.path);
                                            }
                                        }} stagedFiles={repositoryStatus.staged} />
                                        <FileList title="Staged" files={repositoryStatus.staged} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} onToggleStage={async (file) => await unstageFile(file.path)} stagedFiles={repositoryStatus.staged} onSelectAll={unstageAll} selectAllLabel="Unstage All" />
                                        <FileList title="Modified" files={repositoryStatus.unstaged} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} onToggleStage={async (file) => await stageFile(file.path)} stagedFiles={repositoryStatus.staged} onSelectAll={stageAll} selectAllLabel="Stage All" />
                                        <FileList title="Untracked" files={repositoryStatus.untracked.map(p => ({ path: p, status: "untracked" as any }))} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} onToggleStage={async (file) => await stageFile(file.path)} stagedFiles={repositoryStatus.staged} onSelectAll={stageAll} selectAllLabel="Stage All" />

                                        {repositoryStatus.staged.length === 0 &&
                                            repositoryStatus.unstaged.length === 0 &&
                                            repositoryStatus.untracked.length === 0 &&
                                            repositoryStatus.conflicts.length === 0 && (
                                                <div className="py-24 text-center animate-in fade-in duration-1000">
                                                    <div className="w-12 h-12 mx-auto mb-4 rounded-sm bg-primary/5 flex items-center justify-center">
                                                        <Check className="w-6 h-6 text-primary opacity-30" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground/70 font-black uppercase tracking-[0.2em]">Clean status</p>
                                                </div>
                                            )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                                {commits.length > 0 ? (
                                    commits.map((commit, index) => {
                                        const isSelected = selectedCommitHash === commit.hash;
                                        let dateStr = "Unknown Date";
                                        try {
                                            const d = new Date(commit.timestamp);
                                            if (!isNaN(d.getTime())) {
                                                dateStr = d.toLocaleDateString();
                                            }
                                        } catch (e) {
                                            console.error("Date parsing error:", e);
                                        }

                                        return (
                                            <ContextMenu key={commit.hash}>
                                                <ContextMenuTrigger asChild>
                                                    <div
                                                        onClick={() => loadCommitFiles(commit.hash)}
                                                        className={cn(
                                                            "w-full flex flex-col gap-1.5 px-4 py-3 rounded-xl transition-all group border border-transparent hover:border-border/10 relative cursor-pointer",
                                                            isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-primary/5"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-mono font-black text-primary/40 group-hover:text-primary transition-colors bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{commit.short_hash}</span>
                                                                {index === 0 && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            undoCommit();
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-widest border border-destructive/20 hover:bg-destructive/20 rounded-none"
                                                                    >
                                                                        Undo
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-tighter shrink-0">{dateStr}</span>
                                                        </div>
                                                        <p className="text-xs font-mono text-foreground/90 leading-tight truncate">{commit.message}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <img
                                                                src={getAvatarUrl(commit.hash, commit.email)}
                                                                alt={commit.author}
                                                                className="w-4 h-4 rounded-full opacity-100"
                                                            />
                                                            <span className="text-[10px] font-bold text-muted-foreground">{commit.author}</span>
                                                        </div>
                                                    </div>
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-64 bg-card border-border rounded-none shadow-2xl">
                                                    <ContextMenuItem
                                                        className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                        onClick={() => {
                                                            /* TODO: Implement dialog for branch name input */
                                                            const branchName = prompt("Enter new branch name:");
                                                            if (branchName) createBranchFromCommit(branchName, commit.hash);
                                                        }}
                                                    >
                                                        <GitBranchPlus className="w-3.5 h-3.5" />
                                                        Create branch from commit
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                        onClick={() => checkoutCommit(commit.hash)}
                                                    >
                                                        <GitCommitVertical className="w-3.5 h-3.5" />
                                                        Checkout commit
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                        onClick={() => revertCommit(commit.hash)}
                                                    >
                                                        <History className="w-3.5 h-3.5" />
                                                        Revert changes in commit
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                        onClick={() => resetToCommit(commit.hash)}
                                                    >
                                                        <CornerUpLeft className="w-3.5 h-3.5" />
                                                        Reset to commit...
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                        onClick={() => cherryPickCommit(commit.hash)}
                                                    >
                                                        <GitBranchPlus className="w-3.5 h-3.5" />
                                                        Cherry-pick commit...
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(commit.hash);
                                                        }}
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                        Copy SHA
                                                    </ContextMenuItem>
                                                    {selectedRepo?.remote_url && (selectedRepo.remote_url.includes("github.com") || selectedRepo.remote_url.includes("gitlab.com")) && (
                                                        <ContextMenuItem
                                                            className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer"
                                                            onClick={async () => {
                                                                const url = selectedRepo.remote_url?.replace(/\.git$/, "");
                                                                if (url) {
                                                                    // Basic heuristic for GitHub/GitLab commit URLs
                                                                    const commitUrl = `${url}/commit/${commit.hash}`;
                                                                    const opener = await import("@tauri-apps/plugin-opener") as any;
                                                                    if (opener && typeof opener.open === 'function') {
                                                                        await opener.open(commitUrl);
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            View on GitHub
                                                        </ContextMenuItem>
                                                    )}
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground/30 text-[9px] uppercase tracking-widest font-black py-32">
                                        No commit history found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Commit Box at bottom of left column */}
                    <div className="p-4 border-t border-border/10 bg-card/40 backdrop-blur-xl">
                        <textarea
                            ref={commitInputRef}
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Briefly describe your changes..."
                            className="w-full min-h-[100px] p-4 text-sm border border-border/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none resize-none transition-all placeholder:text-muted-foreground/20 bg-background/20 rounded-xl font-medium shadow-inner"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    handleCommit();
                                }
                            }}
                        />
                        <div className="flex justify-center mt-3">
                            <button
                                onClick={handleCommit}
                                disabled={!commitMessage.trim() || isLoading}
                                className={cn(
                                    "w-full py-3 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 rounded-xl flex items-center justify-center gap-2 group relative overflow-hidden",
                                    isCommitted && "brightness-110"
                                )}
                            >
                                <span className={cn("relative z-10 flex items-center gap-2", isCommitted && "opacity-0")}>
                                    Commit to <strong>{repositoryStatus?.branch || "main"}</strong>
                                </span>
                                {isCommitted && (
                                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Optional middle column for commit details (files list) */}
                {activeTab === "history" && selectedCommitHash && (
                    <div className="w-64 border-r border-border/10 flex flex-col bg-card/60 animate-in slide-in-from-left duration-300">
                        <div className="h-14 flex items-center px-6 border-b border-border/5 bg-background/20">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                                {selectedCommitFiles.length} files changed
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                            {selectedCommitFiles.map(file => (
                                <button
                                    key={file.path}
                                    onClick={() => setSelectedFile(file.path)}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-[11px] rounded-lg transition-all flex items-center gap-3 group",
                                        selectedFile === file.path ? "bg-primary text-primary-foreground font-bold" : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0 shadow-sm",
                                        file.status === "added" ? "bg-green-500" :
                                            file.status === "deleted" ? "bg-red-500" : "bg-blue-400"
                                    )} />
                                    <span className="truncate font-mono text-xs opacity-90">{file.path.split('/').pop()}</span>
                                    <span className="ml-auto opacity-0 group-hover:opacity-60 text-[10px] font-mono font-black">{file.status.charAt(0).toUpperCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 bg-background flex flex-col overflow-hidden">
                    {selectedFile ? (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                            <div className="h-14 border-b border-border/5 flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-10">
                                <span className="text-[11px] font-mono text-muted-foreground truncate">{selectedFile}</span>

                                {repositoryStatus?.conflicts.find(c => c.path === selectedFile) && (
                                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex bg-destructive/5 border border-destructive/20 p-1.5 rounded-xl gap-1.5 backdrop-blur-xl">
                                            <button
                                                onClick={() => resolveConflict(selectedFile, "ours")}
                                                className="px-4 py-2 bg-background border border-border/20 hover:bg-primary/10 hover:border-primary/40 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2"
                                            >
                                                <CornerUpLeft className="w-3.5 h-3.5 opacity-50" />
                                                Use Ours
                                            </button>
                                            <button
                                                onClick={() => resolveConflict(selectedFile, "theirs")}
                                                className="px-4 py-2 bg-background border border-border/20 hover:bg-primary/10 hover:border-primary/40 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                                Use Theirs
                                            </button>
                                            <div className="w-px h-6 bg-border/20 mx-1 self-center" />
                                            <button
                                                onClick={() => useAppStore.getState().openSelectedFileInEditor()}
                                                className="px-4 py-2 bg-primary/20 border border-primary/20 hover:bg-primary/30 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 text-primary"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                Open in Editor
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-auto bg-white dark:bg-[#0d1117] font-mono text-[12px] leading-[1.6]">
                                {selectedFileDiff ? (
                                    <GitHubDiffView diff={selectedFileDiff} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground/30 text-[10px] uppercase tracking-widest font-black">
                                        No diff available or loading...
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground p-12 text-center animate-in fade-in duration-1000">
                            <div className="max-w-md">
                                <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-none bg-primary/5 flex items-center justify-center">
                                    <FileText className="w-full h-full text-primary opacity-20" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40 mb-2">No file selected</h3>
                                <p className="text-[10px] text-muted-foreground/40 font-medium">Select a file from the list to review changes.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Merge Conflict Modal */}
            <MergeConflictModal
                open={mergeConflictModalOpen}
                onOpenChange={setMergeConflictModalOpen}
            />
        </main >
    );
}

function GitHubDiffView({ diff }: { diff: string }) {
    const lines = diff.split('\n');
    let oldLineCount = 0;
    let newLineCount = 0;

    const parsedLines = lines.map((line) => {
        let type: 'normal' | 'add' | 'delete' | 'hunk' | 'meta' = 'normal';
        let oldLine: number | undefined;
        let newLine: number | undefined;

        if (line.startsWith('@@')) {
            type = 'hunk';
            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (match) {
                oldLineCount = parseInt(match[1]) - 1;
                newLineCount = parseInt(match[2]) - 1;
            }
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
            type = 'add';
            newLineCount++;
            newLine = newLineCount;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            type = 'delete';
            oldLineCount++;
            oldLine = oldLineCount;
        } else if (line.startsWith(' ') || line === '') {
            type = 'normal';
            oldLineCount++;
            newLineCount++;
            oldLine = oldLineCount;
            newLine = newLineCount;
        } else {
            type = 'meta';
        }

        return { content: line, type, oldLine, newLine };
    });

    return (
        <div className="min-w-full inline-block pb-12">
            {parsedLines.slice(0, 400).map((line, idx) => {
                if (line.type === 'meta' && idx < 5) return null; // Hide initial git diff meta lines

                return (
                    <div
                        key={idx}
                        className={cn(
                            "flex group min-h-[22px] font-mono text-[11px] leading-relaxed",
                            line.type === 'add' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500/50" :
                                line.type === 'delete' ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-l-4 border-rose-500/50" :
                                    line.type === 'hunk' ? "bg-muted/40 border-y border-border/20 text-muted-foreground/60 sticky top-0 z-10 backdrop-blur-md py-1.5" :
                                        line.type === 'meta' ? "text-muted-foreground/40 bg-muted/20 opacity-70 px-6 py-2 border-y border-border/10 my-2" :
                                            "hover:bg-muted/20 border-l-4 border-transparent"
                        )}
                    >
                        {/* Line Numbers Gutter */}
                        {line.type !== 'meta' && (
                            <div className="w-24 shrink-0 flex select-none text-muted-foreground/30 border-r border-border/10 mr-6 bg-muted/10 group-hover:bg-muted/20 font-mono text-[9px]">
                                <div className="w-12 text-right pr-3 py-0.5 opacity-40">
                                    {line.oldLine || ''}
                                </div>
                                <div className="w-12 text-right pr-3 py-0.5 opacity-40 border-l border-border/10">
                                    {line.newLine || ''}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className={cn(
                            "flex-1 py-0.5 whitespace-pre pr-8 font-mono text-[11px] leading-relaxed tracking-tight overflow-hidden",
                            line.type === 'add' ? "text-emerald-700 dark:text-emerald-400 opacity-90" :
                                line.type === 'delete' ? "text-rose-700 dark:text-rose-400 opacity-90" :
                                    line.type === 'hunk' ? "text-primary/60 font-black italic tracking-widest bg-primary/2 py-2 my-1" :
                                        line.type === 'meta' ? "italic text-muted-foreground/30" :
                                            "text-muted-foreground/70"
                        )}>
                            <span className="inline-block w-8 opacity-20 select-none text-center font-black">
                                {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                            </span>
                            {(() => {
                                const content = line.type === 'add' || line.type === 'delete' ? line.content.substring(1) : line.content;

                                // PERFORMANCE: Truncate extremely long lines (prevent browser layout engine crash)
                                const MAX_CHAR_LIMIT = 1000;
                                const isTruncated = content.length > MAX_CHAR_LIMIT;
                                const displayContent = isTruncated ? content.substring(0, MAX_CHAR_LIMIT) : content;

                                // PERFORMANCE: Bypass highlighting for long lines (avoid expensive regex on minified files)
                                if (displayContent.length > 300) {
                                    return <span>{displayContent}{isTruncated && '... (line truncated)'}</span>;
                                }

                                return highlightCode(displayContent);
                            })()}
                        </div>
                    </div>
                );
            })}

            {parsedLines.length > 400 && (
                <div className="px-6 py-12 flex flex-col items-center gap-4 bg-muted/20 border-t border-border/10 mt-8">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary opacity-40 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">Diff Optimized</h4>
                        <p className="text-[9px] text-muted-foreground/30 font-medium max-w-xs mx-auto">This file is very large. Only the first 400 lines are shown with performance limits active.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function highlightCode(code: string) {
    const keywords = /\b(pub|fn|use|let|const|async|await|import|export|function|return|if|else|match|switch|case|default|type|interface|enum|struct|impl|mut|self|true|false)\b/g;
    const strings = /("[^"]*"|'[^']*'|`[^`]*`)/g;
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
    const types = /\b(u8|u16|u32|u64|i8|i16|i32|i64|usize|isize|String|Vec|Option|Result|String|number|boolean|any|void)\b/g;

    const parts = code.split(/([ \t\n()\[\]{}.,:;])/);

    return (
        <>
            {parts.map((part, i) => {
                if (keywords.test(part)) return <span key={i} className="text-zinc-700 dark:text-zinc-400 font-bold">{part}</span>;
                if (types.test(part)) return <span key={i} className="text-zinc-600 dark:text-zinc-500">{part}</span>;
                if (strings.test(part)) return <span key={i} className="text-zinc-800 dark:text-zinc-300 italic">{part}</span>;
                if (comments.test(part)) return <span key={i} className="text-zinc-500 dark:text-zinc-600 italic">{part}</span>;
                return <span key={i} className="text-zinc-600/80 dark:text-zinc-400/80">{part}</span>;
            })}
        </>
    );
}

function FileList({
    title,
    files,
    onFileSelect,
    selectedFile,
    discardChanges,
    addToGitignore,
    onToggleStage,
    stagedFiles,
    onSelectAll,
    selectAllLabel,
}: {
    title: string;
    files: any[];
    onFileSelect: (path: string) => void;
    selectedFile: string | null;
    discardChanges: (path: string) => void;
    addToGitignore: (path: string) => void;
    onToggleStage: (file: any) => void;
    stagedFiles: any[];
    onSelectAll?: () => void;
    selectAllLabel?: string;
}) {
    if (files.length === 0) return null;

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-[11px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">{title}</h3>
                {onSelectAll && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectAll();
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors px-2 py-1 bg-primary/5 hover:bg-primary/10 rounded-lg"
                    >
                        {selectAllLabel || "Select All"}
                    </button>
                )}
            </div>
            <div className="space-y-1.5">
                {files.map((file) => {
                    const pathSegments = file.path.split('/');
                    const ignoreOptions = pathSegments.reduce((acc: string[], _segment: string, idx: number) => {
                        const currentPath = pathSegments.slice(0, idx + 1).join('/');
                        const pattern = idx === pathSegments.length - 1 ? currentPath : `${currentPath}/`;
                        acc.push(pattern);
                        return acc;
                    }, []).reverse();

                    return (
                        <ContextMenu key={file.path}>
                            <ContextMenuTrigger asChild>
                                <div className="flex items-center w-full group overflow-hidden first:rounded-t-xl last:rounded-b-xl">
                                    {/* Selective Staging Checkbox */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleStage(file);
                                        }}
                                        className={cn(
                                            "w-10 h-[46px] flex items-center justify-center transition-all border-r border-transparent shrink-0",
                                            stagedFiles.some(s => s.path === file.path)
                                                ? "bg-primary/10 text-primary border-primary/20"
                                                : "bg-muted/20 text-muted-foreground/20 hover:text-muted-foreground/40 hover:bg-muted/40"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-3.5 h-3.5 border transition-all flex items-center justify-center rounded-none",
                                            stagedFiles.some(s => s.path === file.path)
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground/20"
                                        )}>
                                            {stagedFiles.some(s => s.path === file.path) && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => onFileSelect(file.path)}
                                        className={cn(
                                            "flex-1 flex items-center gap-4 px-4 py-3 text-left transition-all relative overflow-hidden",
                                            selectedFile === file.path
                                                ? "bg-primary/20 border-l-2 border-primary text-primary"
                                                : "hover:bg-primary/5 text-muted-foreground/80 hover:text-foreground"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0 shadow-sm",
                                            file.status === "added" || file.status === "untracked" ? "bg-[hsl(var(--git-added))]" :
                                                file.status === "modified" ? "bg-[hsl(var(--git-modified))]" :
                                                    file.status === "deleted" ? "bg-[hsl(var(--git-deleted))]" :
                                                        file.status === "conflicted" ? "bg-destructive animate-pulse" : "bg-muted-foreground"
                                        )} />
                                        <span className="text-xs font-bold truncate flex-1 font-mono tracking-tight">{file.path}</span>
                                        {file.status && (
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity",
                                                file.status === "added" || file.status === "untracked" ? "text-[hsl(var(--git-added))]" :
                                                    file.status === "modified" ? "text-[hsl(var(--git-modified))]" :
                                                        file.status === "deleted" ? "text-[hsl(var(--git-deleted))]" :
                                                            file.status === "conflicted" ? "text-destructive" : ""
                                            )}>
                                                {file.status}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-64 bg-card border-border rounded-none shadow-2xl">
                                <ContextMenuItem
                                    onClick={() => discardChanges(file.path)}
                                    className="flex items-center gap-3 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Discard Changes
                                </ContextMenuItem>

                                <ContextMenuSub>
                                    <ContextMenuSubTrigger className="flex items-center gap-3 py-2.5 text-xs font-bold cursor-pointer">
                                        <EyeOff className="w-3.5 h-3.5" />
                                        Add to .gitignore
                                    </ContextMenuSubTrigger>
                                    <ContextMenuPortal>
                                        <ContextMenuSubContent className="min-w-[320px] max-w-[480px] bg-card border-border rounded-none shadow-2xl">
                                            {ignoreOptions.map((option: string) => (
                                                <ContextMenuItem
                                                    key={option}
                                                    onClick={() => addToGitignore(option)}
                                                    className="py-2.5 text-xs font-mono font-bold cursor-pointer truncate px-4"
                                                >
                                                    {option}
                                                </ContextMenuItem>
                                            ))}
                                        </ContextMenuSubContent>
                                    </ContextMenuPortal>
                                </ContextMenuSub>
                            </ContextMenuContent>
                        </ContextMenu>
                    );
                })}
            </div>
        </div>
    );
}
