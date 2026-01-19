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
    ChevronDown
} from "lucide-react";
import { WelcomeView } from "./WelcomeView";

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
        error,
        clearError,
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
            <main className="flex-1 flex flex-col bg-background/80 backdrop-blur-3xl overflow-hidden border border-border/40 rounded-3xl m-4 shadow-2xl">
                <WelcomeView />
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-background/40 backdrop-blur-3xl overflow-hidden border border-border/20 rounded-3xl m-4 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] animate-in fade-in duration-500 relative">
            {/* Global Error Notification */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-destructive/10 backdrop-blur-xl border border-destructive/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl">
                        <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
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
                        <div className="p-2 rounded-xl bg-primary/5 text-primary/40 group-hover/repo:bg-primary/20 group-hover/repo:text-primary transition-all duration-300 ring-1 ring-primary/5">
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
                                "flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all rounded-xl group",
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
                                <div className="absolute top-full left-0 mt-3 w-[400px] bg-card/80 backdrop-blur-2xl border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20 animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl overflow-hidden flex flex-col">
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
                                                className="w-full bg-background/50 border border-border/40 py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary/60 rounded-xl placeholder:text-muted-foreground/30 shadow-inner"
                                            />
                                        </div>
                                        <button
                                            className="px-4 py-2.5 bg-secondary text-secondary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all rounded-xl"
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
                                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 mx-2 w-[calc(100%-1rem)] rounded-xl"
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
                                                                "w-full flex items-center gap-4 px-4 py-3 text-sm font-medium text-left transition-all rounded-xl",
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
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-6 bg-border/20" />

                    {/* Git Actions */}
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={fetch}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/5 active:scale-[0.98] disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                            Fetch
                        </button>
                        <button
                            onClick={pull}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/5 active:scale-[0.98] disabled:opacity-50"
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                            Pull
                        </button>
                        <button
                            onClick={push}
                            disabled={isLoading}
                            className={cn(
                                "flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border active:scale-[0.98] disabled:opacity-50",
                                isLoading ? "bg-primary/5 text-primary/40 border-primary/5" : "bg-primary/10 text-primary border-primary/5 hover:bg-primary/20"
                            )}
                        >
                            <Upload className={cn("w-3.5 h-3.5", isLoading && "animate-pulse")} />
                            {isLoading ? "Pushing..." : "Push"}
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
                                        <FileList title="Staged" files={repositoryStatus.staged} onFileSelect={setSelectedFile} selectedFile={selectedFile} />
                                        <FileList title="Modified" files={repositoryStatus.unstaged} onFileSelect={setSelectedFile} selectedFile={selectedFile} />
                                        <FileList title="Untracked" files={repositoryStatus.untracked.map(p => ({ path: p, status: "untracked" }))} onFileSelect={setSelectedFile} selectedFile={selectedFile} />

                                        {repositoryStatus.staged.length === 0 &&
                                            repositoryStatus.unstaged.length === 0 &&
                                            repositoryStatus.untracked.length === 0 && (
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
                                    commits.map((commit) => {
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
                                                className="w-full flex flex-col gap-1.5 px-4 py-4 hover:bg-primary/5 rounded-2xl transition-all group border border-transparent hover:border-border/10"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] font-mono text-primary/40 group-hover:text-primary transition-colors bg-primary/5 px-2 py-0.5 rounded-full">{commit.short_hash}</span>
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
                            className="w-full min-h-[100px] p-4 text-sm border border-border/20 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 focus:outline-none resize-none transition-all placeholder:text-muted-foreground/20 bg-background/20 rounded-2xl font-medium shadow-inner"
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
                                "w-full mt-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3",
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

                {/* Right Column: Diff View */}
                <div className="flex-1 bg-background flex flex-col overflow-hidden">
                    {selectedFileDiff ? (
                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                            <div className="h-12 border-b border-border/20 flex items-center px-6 bg-muted/40 backdrop-blur-sm">
                                <span className="text-[11px] font-mono text-muted-foreground truncate">{selectedFile}</span>
                            </div>
                            <div className="flex-1 overflow-auto bg-background/20 font-mono text-[13px] leading-relaxed p-6 whitespace-pre">
                                {selectedFileDiff.split('\n').map((line, idx) => {
                                    const isAdded = line.startsWith('+');
                                    const isDeleted = line.startsWith('-');
                                    const isHeader = line.startsWith('@@');

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "px-2 -mx-2 border-l-2 border-transparent",
                                                isAdded ? "bg-[hsl(var(--git-added))/0.1] text-[hsl(var(--git-added))] border-[hsl(var(--git-added))]" :
                                                    isDeleted ? "bg-[hsl(var(--git-deleted))/0.1] text-[hsl(var(--git-deleted))] border-[hsl(var(--git-deleted))]" :
                                                        isHeader ? "text-primary/60 bg-primary/5 italic" : ""
                                            )}
                                        >
                                            {line}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground p-12 text-center animate-in fade-in duration-1000">
                            <div className="max-w-md">
                                <div className="w-16 h-16 mx-auto mb-6 p-4 rounded-none bg-primary/5 border border-primary/10 flex items-center justify-center">
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

function FileList({
    title,
    files,
    onFileSelect,
    selectedFile,
}: {
    title: string;
    files: any[];
    onFileSelect: (path: string) => void;
    selectedFile: string | null;
}) {
    if (files.length === 0) return null;

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <h3 className="text-[11px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] px-2 mb-3">{title}</h3>
            <div className="space-y-1.5">
                {files.map((file) => (
                    <button
                        key={file.path}
                        onClick={() => onFileSelect(file.path)}
                        className={cn(
                            "w-full flex items-center gap-4 px-4 py-3 transition-all text-left group border border-transparent rounded-xl",
                            selectedFile === file.path
                                ? "bg-primary/20 border-primary/30 text-primary shadow-lg shadow-primary/5"
                                : "hover:bg-primary/10 text-muted-foreground/80 hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "w-2 h-2 rounded-full shrink-0 shadow-sm",
                            file.status === "added" || file.status === "untracked" ? "bg-[hsl(var(--git-added))]" :
                                file.status === "modified" ? "bg-[hsl(var(--git-modified))]" :
                                    file.status === "deleted" ? "bg-[hsl(var(--git-deleted))]" : "bg-muted-foreground"
                        )} />
                        <span className="text-sm font-bold truncate flex-1">{file.path}</span>
                        {file.status && (
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity",
                                file.status === "added" || file.status === "untracked" ? "text-[hsl(var(--git-added))]" :
                                    file.status === "modified" ? "text-[hsl(var(--git-modified))]" :
                                        file.status === "deleted" ? "text-[hsl(var(--git-deleted))]" : ""
                            )}>
                                {file.status}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
