/**
 * Main content area displaying selected repository status
 */

import React from "react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import {
    GitBranch,
    Check,
    FileText,
    RefreshCw,
    Upload,
    ArrowDown,
    ChevronDown,
    Trash2,
    EyeOff
} from "lucide-react";
import { WelcomeView } from "./WelcomeView";
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

export function MainArea() {
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

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(branchFilter.toLowerCase())
    );

    const defaultBranch = branches.find(b => b.name === "main" || b.name === "master");
    const otherBranches = filteredBranches.filter(b => b.name !== (defaultBranch?.name || ""));

    if (!selectedRepositoryPath || !selectedRepo) {
        return (
            <main className="flex-1 flex flex-col bg-background/80 backdrop-blur-3xl overflow-hidden border border-border/40 rounded-none m-4 shadow-2xl">
                <WelcomeView />
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-background/40 backdrop-blur-3xl overflow-hidden border border-border/20 rounded-none m-4 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] animate-in fade-in duration-500 relative">
            {/* Global Error Notification */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-destructive/10 backdrop-blur-xl border border-destructive/20 px-6 py-3 rounded-none flex items-center gap-4 shadow-2xl">
                        <div className="p-2 rounded-none bg-destructive/20 text-destructive">
                            <RefreshCw className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-destructive/90">{error}</span>
                        <button
                            onClick={clearError}
                            className="ml-2 p-1 hover:bg-destructive/20 rounded-md transition-colors text-destructive"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header with Glassmorphism */}
            <header className="flex flex-col border-b border-border/20 bg-card/40 backdrop-blur-md">
                <div className="flex items-center h-16 px-6 gap-6">
                    {/* Repository Indicator */}
                    <div className="flex items-center gap-4 px-4 py-2 border border-transparent max-w-[300px] group/repo">
                        <div className="p-2 rounded-none bg-primary/5 text-primary/40 group-hover/repo:bg-primary/20 group-hover/repo:text-primary transition-all duration-300 ring-1 ring-primary/5">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase text-muted-foreground/30 leading-none mb-1.5 tracking-[0.2em]">Repository</span>
                            <span className="text-sm font-bold truncate text-foreground/70 group-hover/repo:text-foreground transition-colors">{selectedRepo.name}</span>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-border/20" />

                    {/* Branch Selector with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setBranchSelectorOpen(!branchSelectorOpen)}
                            className={cn(
                                "flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all rounded-none group",
                                branchSelectorOpen && "ring-2 ring-primary/30 bg-primary/20"
                            )}
                        >
                            <GitBranch className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100" />
                            <span className="text-sm font-black text-foreground">{repositoryStatus?.branch || "main"}</span>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground/30 transition-transform", branchSelectorOpen && "rotate-180")} />
                        </button>

                        {branchSelectorOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setBranchSelectorOpen(false)}
                                />
                                <div className="absolute top-full left-0 mt-3 w-[400px] bg-card/80 backdrop-blur-2xl border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20 animate-in fade-in slide-in-from-top-4 duration-300 rounded-none overflow-hidden flex flex-col">
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

                                    <div className="flex-1 overflow-y-auto max-h-[500px]">
                                        {/* Default Branch */}
                                        {defaultBranch && (!branchFilter || defaultBranch.name.toLowerCase().includes(branchFilter.toLowerCase())) && (
                                            <div className="py-3">
                                                <div className="px-5 py-1.5">
                                                    <span className="text-[10px] font-black uppercase text-secondary-foreground/40 tracking-[0.2em]">Default branch</span>
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
                                                <span className="text-[10px] font-black uppercase text-secondary-foreground/40 tracking-[0.2em]">Other branches</span>
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
                                        <button className="w-full flex items-center justify-center gap-3 py-3 border border-border/40 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary/10 hover:border-primary/40 transition-all rounded-none text-primary/80">
                                            <GitBranch className="w-4 h-4" />
                                            Merge into <strong>{repositoryStatus?.branch || "main"}</strong>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-6 bg-border/20" />

                    {/* Git Actions */}
                    <div className="flex items-center gap-3 ml-auto shrink-0">
                        <button
                            onClick={fetch}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 text-primary rounded-none text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/5 active:scale-[0.98] disabled:opacity-50 min-w-[120px] justify-center"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
                            {isFetching ? "Fetching" : "Fetch"}
                        </button>
                        <button
                            onClick={pull}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 text-primary rounded-none text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/5 active:scale-[0.98] disabled:opacity-50 min-w-[110px] justify-center"
                        >
                            <ArrowDown className={cn("w-3.5 h-3.5", isPulling && "animate-bounce")} />
                            {isPulling ? "Pulling" : "Pull"}
                        </button>
                        <button
                            onClick={push}
                            disabled={isLoading}
                            className={cn(
                                "flex items-center gap-3 px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all border active:scale-[0.98] disabled:opacity-50 min-w-[130px] justify-center",
                                isPushing ? "bg-primary/5 text-primary/40 border-primary/5" : "bg-primary/10 text-primary border-primary/5 hover:bg-primary/20"
                            )}
                        >
                            <Upload className={cn("w-3.5 h-3.5", isPushing && "animate-pulse")} />
                            {isPushing ? "Pushing" : "Push"}
                        </button>
                    </div>
                </div>

                {/* Secondary Header / Tabs */}
                <div className="flex items-center px-6 h-12 border-t border-border/10 bg-card/20 backdrop-blur-sm">
                    <div className="flex h-full gap-6">
                        <button
                            onClick={() => setActiveTab("changes")}
                            className={cn(
                                "h-full px-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative border-b-2",
                                activeTab === "changes" ? "text-primary border-primary" : "text-muted-foreground/60 border-transparent hover:text-foreground"
                            )}
                        >
                            Changes
                            {repositoryStatus && (repositoryStatus.staged.length + repositoryStatus.unstaged.length + repositoryStatus.untracked.length) > 0 && (
                                <span className="ml-2 text-primary font-black px-2 py-0.5 bg-primary/20 rounded-full text-[10px]">
                                    {repositoryStatus.staged.length + repositoryStatus.unstaged.length + repositoryStatus.untracked.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={cn(
                                "h-full px-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative border-b-2",
                                activeTab === "history" ? "text-primary border-primary" : "text-muted-foreground/60 border-transparent hover:text-foreground"
                            )}
                        >
                            History
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area: Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: File List & Commit */}
                <div className="w-80 border-r border-border/20 flex flex-col bg-card">
                    <div className="flex-1 overflow-y-auto">
                        {isLoading && !selectedFile ? (
                            <div className="p-8 text-center text-muted-foreground/30 text-[9px] uppercase tracking-widest font-black py-20">Loading...</div>
                        ) : activeTab === "changes" ? (
                            <div className="p-3 space-y-6">
                                {repositoryStatus && (
                                    <>
                                        <FileList title="Conflicts" files={repositoryStatus.conflicts} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} />
                                        <FileList title="Staged" files={repositoryStatus.staged} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} />
                                        <FileList title="Modified" files={repositoryStatus.unstaged} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} />
                                        <FileList title="Untracked" files={repositoryStatus.untracked.map(p => ({ path: p, status: "untracked" as any }))} onFileSelect={setSelectedFile} selectedFile={selectedFile} discardChanges={discardChanges} addToGitignore={addToGitignore} />

                                        {repositoryStatus.staged.length === 0 &&
                                            repositoryStatus.unstaged.length === 0 &&
                                            repositoryStatus.untracked.length === 0 &&
                                            repositoryStatus.conflicts.length === 0 && (
                                                <div className="py-24 text-center animate-in fade-in duration-1000">
                                                    <div className="w-12 h-12 mx-auto mb-4 rounded-sm bg-primary/5 flex items-center justify-center border border-primary/10">
                                                        <Check className="w-6 h-6 text-primary opacity-30" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">Clean status</p>
                                                </div>
                                            )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                                {commits.length > 0 ? (
                                    commits.map((commit, index) => {
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
                                            <div
                                                key={commit.hash}
                                                className="w-full flex flex-col gap-1.5 px-4 py-4 hover:bg-primary/5 rounded-none transition-all group border border-transparent hover:border-border/10 relative"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-primary/40 group-hover:text-primary transition-colors bg-primary/5 px-2 py-0.5 rounded-full">{commit.short_hash}</span>
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
                                                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter shrink-0">{dateStr}</span>
                                                </div>
                                                <p className="text-sm font-bold text-foreground/80 leading-relaxed truncate">{commit.message}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-primary/20" />
                                                    <span className="text-[10px] font-bold text-muted-foreground/40">{commit.author}</span>
                                                </div>
                                            </div>
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
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Briefly describe your changes..."
                            className="w-full min-h-[100px] p-4 text-sm border border-border/20 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none resize-none transition-all placeholder:text-muted-foreground/20 bg-background/20 rounded-none font-medium shadow-inner"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    handleCommit();
                                }
                            }}
                        />
                        <button
                            onClick={handleCommit}
                            disabled={!commitMessage.trim() || isLoading}
                            className={cn(
                                "w-full mt-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all rounded-none flex items-center justify-center gap-3",
                                isCommitted
                                    ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                    : "bg-primary/20 text-primary hover:bg-primary/30 shadow-lg shadow-primary/5 border border-primary/10",
                                (isLoading && !isCommitted) && "opacity-50"
                            )}
                        >
                            {isCommitted ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Committed!
                                </>
                            ) : (
                                <>Commit to {repositoryStatus?.branch || "main"}</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-background flex flex-col overflow-hidden">
                    {selectedFile ? (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                            <div className="h-12 border-b border-border/20 flex items-center px-6 bg-muted/40 backdrop-blur-sm justify-between gap-4">
                                <span className="text-[11px] font-mono text-muted-foreground truncate">{selectedFile}</span>

                                {repositoryStatus?.conflicts.find(c => c.path === selectedFile) && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-500">
                                        <div className="flex bg-destructive/5 border border-destructive/20 p-1 rounded-none gap-1">
                                            <button
                                                onClick={() => resolveConflict(selectedFile, "ours")}
                                                className="px-3 py-1.5 bg-background border border-border/20 hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all rounded-none"
                                            >
                                                Use Ours
                                            </button>
                                            <button
                                                onClick={() => resolveConflict(selectedFile, "theirs")}
                                                className="px-3 py-1.5 bg-background border border-border/20 hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-all rounded-none"
                                            >
                                                Use Theirs
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 overflow-auto bg-[#0d1117] font-mono text-[12px] leading-[1.6]">
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
        </main>
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
            {parsedLines.map((line, idx) => {
                if (line.type === 'meta' && idx < 5) return null; // Hide initial git diff meta lines

                return (
                    <div
                        key={idx}
                        className={cn(
                            "flex group min-h-[22px]",
                            line.type === 'add' ? "bg-[#2ea0431a]" :
                                line.type === 'delete' ? "bg-[#f851491a]" :
                                    line.type === 'hunk' ? "bg-[#388bfd1a] border-y border-[#388bfd33] text-[#7d8590] sticky top-0 z-10" :
                                        line.type === 'meta' ? "text-[#7d8590] bg-muted/5 opacity-40 px-6 py-2 border-y border-border/5 my-2" :
                                            "hover:bg-[#1f242c]"
                        )}
                    >
                        {/* Line Numbers Gutter */}
                        {line.type !== 'meta' && (
                            <div className="w-28 shrink-0 flex select-none text-[#8b949e] border-r border-[#30363d] mr-4 bg-[#0d1117] group-hover:bg-[#1f242c] transition-colors">
                                <div className="w-14 text-right pr-3 py-0.5 font-mono text-[11px] opacity-60">
                                    {line.oldLine || ''}
                                </div>
                                <div className="w-14 text-right pr-3 py-0.5 font-mono text-[11px] opacity-60">
                                    {line.newLine || ''}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className={cn(
                            "flex-1 py-0.5 whitespace-pre pr-6 font-mono",
                            line.type === 'add' ? "text-[#aff5b4] bg-[#2ea04333]" :
                                line.type === 'delete' ? "text-[#ffdcd7] bg-[#f8514933]" :
                                    line.type === 'hunk' ? "text-[#7d8590] font-bold py-1.5 px-2" :
                                        line.type === 'meta' ? "italic text-[11px]" :
                                            "text-[#c9d1d9]"
                        )}>
                            <span className="inline-block w-6 opacity-30 select-none text-center font-mono">
                                {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                            </span>
                            {(() => {
                                const content = line.type === 'add' || line.type === 'delete' ? line.content.substring(1) : line.content;
                                return highlightCode(content);
                            })()}
                        </div>
                    </div>
                );
            })}
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
                if (keywords.test(part)) return <span key={i} className="text-[#ff7b72]">{part}</span>;
                if (types.test(part)) return <span key={i} className="text-[#ffa657]">{part}</span>;
                if (strings.test(part)) return <span key={i} className="text-[#a5d6ff]">{part}</span>;
                if (comments.test(part)) return <span key={i} className="text-[#8b949e] italic">{part}</span>;
                return <span key={i}>{part}</span>;
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
}: {
    title: string;
    files: any[];
    onFileSelect: (path: string) => void;
    selectedFile: string | null;
    discardChanges: (path: string) => void;
    addToGitignore: (path: string) => void;
}) {
    if (files.length === 0) return null;

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <h3 className="text-[11px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] px-2 mb-3">{title}</h3>
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
                                <button
                                    onClick={() => onFileSelect(file.path)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-4 py-3 transition-all text-left group border border-transparent rounded-none",
                                        selectedFile === file.path
                                            ? "bg-primary/20 border-primary/30 text-primary shadow-lg shadow-primary/5"
                                            : "hover:bg-primary/10 text-muted-foreground/80 hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0 shadow-sm",
                                        file.status === "added" || file.status === "untracked" ? "bg-[hsl(var(--git-added))]" :
                                            file.status === "modified" ? "bg-[hsl(var(--git-modified))]" :
                                                file.status === "deleted" ? "bg-[hsl(var(--git-deleted))]" :
                                                    file.status === "conflicted" ? "bg-destructive animate-pulse" : "bg-muted-foreground"
                                    )} />
                                    <span className="text-sm font-bold truncate flex-1">{file.path}</span>
                                    {file.status && (
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity",
                                            file.status === "added" || file.status === "untracked" ? "text-[hsl(var(--git-added))]" :
                                                file.status === "modified" ? "text-[hsl(var(--git-modified))]" :
                                                    file.status === "deleted" ? "text-[hsl(var(--git-deleted))]" :
                                                        file.status === "conflicted" ? "text-destructive" : ""
                                        )}>
                                            {file.status}
                                        </span>
                                    )}
                                </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-64 bg-zinc-900 border-zinc-800 rounded-none shadow-2xl">
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
                                        <ContextMenuSubContent className="min-w-[320px] max-w-[480px] bg-zinc-900 border-zinc-800 rounded-none shadow-2xl">
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
