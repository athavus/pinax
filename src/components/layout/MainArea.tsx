/**
 * Main content area displaying selected repository status
 */

import React from "react";
import { useAppStore } from "@/stores/appStore";
import {
    GitBranch,
    Check,
    AlertCircle,
    FileText,
    FilePlus,
    FileMinus,
    FileEdit,
    RefreshCw,
    Download,
    Upload,
    GitCommit,
    ArrowDown,
} from "lucide-react";

export function MainArea() {
    const {
        selectedRepositoryPath,
        repositoryStatus,
        repositories,
        isLoading,
        fetch,
        pull,
        push,
        commit,
    } = useAppStore();

    const [commitMessage, setCommitMessage] = React.useState("");

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;
        await commit(commitMessage);
        setCommitMessage("");
    };

    const selectedRepo = repositories.find((r) => r.path === selectedRepositoryPath);

    if (!selectedRepositoryPath || !selectedRepo) {
        return (
            <main className="flex-1 flex items-center justify-center bg-[hsl(var(--background))]">
                <div className="text-center text-[hsl(var(--muted-foreground))]">
                    <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Select a repository</p>
                    <p className="text-sm mt-1">Use the sidebar or press ⌘P</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-card rounded-xl shadow-sm overflow-hidden relative">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-[hsl(var(--border))]">
                <div>
                    <h1 className="text-xl font-semibold">{selectedRepo.name}</h1>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] truncate max-w-md">
                        {selectedRepo.path}
                    </p>
                </div>
                {/* Git Controls & Auto-refresh status */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetch}
                        title="Fetch"
                        className="p-2 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={pull}
                        title="Pull"
                        className="p-2 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={push}
                        title="Push"
                        className="p-2 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-[hsl(var(--border))]" />
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Auto-refresh active" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Live</span>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-10 h-10 animate-spin text-[hsl(var(--muted-foreground))]" />
                    </div>
                ) : repositoryStatus ? (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        {/* Branch status */}
                        <div className="grid grid-cols-2 gap-6">
                            <StatusCard
                                icon={<GitBranch className="w-6 h-6" />}
                                title="Current Branch"
                                value={repositoryStatus.branch}
                                meta={
                                    repositoryStatus.ahead > 0 || repositoryStatus.behind > 0
                                        ? `↑${repositoryStatus.ahead} ↓${repositoryStatus.behind}`
                                        : undefined
                                }
                            />

                            {/* Clean status */}
                            <StatusCard
                                icon={
                                    repositoryStatus.is_clean ? (
                                        <Check className="w-6 h-6 text-[hsl(var(--git-added))]" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-[hsl(var(--git-modified))]" />
                                    )
                                }
                                title="Working Tree"
                                value={repositoryStatus.is_clean ? "Clean" : "Has changes"}
                            />
                        </div>

                        {/* Staged changes */}
                        {repositoryStatus.staged.length > 0 && (
                            <ChangesSection
                                title="Staged Changes"
                                changes={repositoryStatus.staged}
                            />
                        )}

                        {/* Unstaged changes */}
                        {repositoryStatus.unstaged.length > 0 && (
                            <ChangesSection
                                title="Unstaged Changes"
                                changes={repositoryStatus.unstaged}
                            />
                        )}

                        {/* Untracked files */}
                        {repositoryStatus.untracked.length > 0 && (
                            <section>
                                <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                                    Untracked Files ({repositoryStatus.untracked.length})
                                </h3>
                                <ul className="space-y-1">
                                    {repositoryStatus.untracked.map((file) => (
                                        <li
                                            key={file}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded bg-[hsl(var(--card))]"
                                        >
                                            <FileText className="w-4 h-4 text-[hsl(var(--git-untracked))]" />
                                            <span className="text-sm truncate">{file}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Commit Section */}
                        <section className="pt-4 border-t border-[hsl(var(--border))]">
                            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                                Commit Changes
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    placeholder="Commit message"
                                    className="flex-1 px-3 py-2 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                            handleCommit();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleCommit}
                                    disabled={!commitMessage.trim() || isLoading}
                                    className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md hover:bg-[hsl(var(--primary))/90] disabled:opacity-50 flex items-center gap-2"
                                >
                                    <GitCommit className="w-4 h-4" />
                                    Commit
                                </button>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="text-center text-[hsl(var(--muted-foreground))]">
                        <p>Loading repository status...</p>
                    </div>
                )}
            </div>
        </main>
    );
}

interface StatusCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    meta?: string;
}

function StatusCard({ icon, title, value, meta }: StatusCardProps) {
    return (
        <div className="flex items-center gap-5 p-6 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm transition-all hover:shadow-md hover:border-[hsl(var(--border))/80]">
            <div className="text-[hsl(var(--primary))] p-3 bg-[hsl(var(--primary))/10] rounded-lg">{icon}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1">{title}</p>
                <p className="text-xl font-bold tracking-tight">{value}</p>
            </div>
            {meta && (
                <span className="text-sm font-mono bg-[hsl(var(--muted))] px-2 py-1 rounded text-[hsl(var(--muted-foreground))]">{meta}</span>
            )}
        </div>
    );
}

interface ChangesSectionProps {
    title: string;
    changes: { path: string; status: string }[];
}

function ChangesSection({ title, changes }: ChangesSectionProps) {
    const getIcon = (status: string) => {
        switch (status) {
            case "added":
                return <FilePlus className="w-4 h-4 text-[hsl(var(--git-added))]" />;
            case "deleted":
                return <FileMinus className="w-4 h-4 text-[hsl(var(--git-deleted))]" />;
            case "modified":
            default:
                return <FileEdit className="w-4 h-4 text-[hsl(var(--git-modified))]" />;
        }
    };

    return (
        <section>
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
                {title} ({changes.length})
            </h3>
            <ul className="space-y-1">
                {changes.map((change) => (
                    <li
                        key={change.path}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-[hsl(var(--card))]"
                    >
                        {getIcon(change.status)}
                        <span className="text-sm truncate">{change.path}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
