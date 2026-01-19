/**
 * Core types for Pinax Git Workbench
 * These types mirror the Rust backend types for type-safe IPC
 */

// ============== Repository Types ==============

export interface Repository {
    path: string;
    name: string;
    remote_url?: string;
    last_commit?: CommitInfo;
}

export interface CommitInfo {
    hash: string;
    short_hash: string;
    message: string;
    author: string;
    timestamp: string;
}

export interface RepositoryStatus {
    branch: string;
    is_clean: boolean;
    ahead: number;
    behind: number;
    staged: FileChange[];
    unstaged: FileChange[];
    untracked: string[];
}

export interface FileChange {
    path: string;
    status: FileStatus;
}

export type FileStatus = "added" | "modified" | "deleted" | "renamed" | "copied";

export interface Branch {
    name: string;
    is_current: boolean;
    is_remote: boolean;
    upstream?: string;
}

// ============== Workspace Types ==============

export interface Workspace {
    id: string;
    name: string;
    repositories: string[]; // Paths to repositories
    color?: string;
    created_at: string;
}

// ============== UI Types ==============

export interface Command {
    id: string;
    label: string;
    shortcut?: string;
    category: string;
    execute: () => void;
}

export type NavigationContext = "sidebar" | "main" | "command-palette";

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    ssh_url: string;
    clone_url: string;
}
