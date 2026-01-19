/**
 * Typed wrappers for Tauri IPC commands
 * Provides type-safe communication between React and Rust
 */

import { invoke } from "@tauri-apps/api/core";
import type { Repository, RepositoryStatus, Branch, Workspace, GitHubRepo, CommitInfo } from "@/types";

/**
 * Scan a directory recursively to find Git repositories
 */
export async function scanRepositories(path: string): Promise<Repository[]> {
    return invoke<Repository[]>("scan_repositories", { path });
}

/**
 * Get the current status of a Git repository
 */
export async function getRepositoryStatus(path: string): Promise<RepositoryStatus> {
    return invoke<RepositoryStatus>("get_repository_status", { path });
}

/**
 * List all branches in a repository
 */
export async function listBranches(path: string): Promise<Branch[]> {
    return invoke<Branch[]>("list_branches", { path });
}

/**
 * Get all workspaces
 */
export async function getWorkspaces(): Promise<Workspace[]> {
    return invoke<Workspace[]>("get_workspaces");
}

/**
 * Create a new workspace
 */
export async function createWorkspace(name: string): Promise<Workspace> {
    return invoke<Workspace>("create_workspace", { name });
}

export async function deleteWorkspace(id: string): Promise<void> {
    return invoke("delete_workspace", { id });
}

/**
 * Add a repository to a workspace
 */
export async function addRepositoryToWorkspace(
    workspaceId: string,
    repoPath: string
): Promise<void> {
    return invoke("add_repository_to_workspace", { workspaceId, repoPath });
}

// ============== Git Operations ==============

export async function gitFetch(path: string): Promise<void> {
    return invoke("git_fetch", { path });
}

export async function gitPull(path: string): Promise<void> {
    return invoke("git_pull", { path });
}

export async function gitPush(path: string): Promise<void> {
    return invoke("git_push", { path });
}

export async function gitCommit(path: string, message: string): Promise<void> {
    return invoke("git_commit", { path, message });
}

export async function gitCheckout(path: string, branch: string): Promise<void> {
    return invoke("git_checkout", { path, branch });
}

export async function gitCreateBranch(path: string, branch: string): Promise<void> {
    return invoke("git_create_branch", { path, branch });
}

export async function gitUndoCommit(path: string): Promise<void> {
    return invoke("git_undo_commit", { path });
}

export async function gitResolveConflict(path: string, filePath: string, resolution: "ours" | "theirs"): Promise<void> {
    return invoke("git_resolve_conflict", { path, filePath, resolution });
}

export async function getFileDiff(path: string, filePath: string): Promise<string> {
    return invoke("get_file_diff", { path, filePath });
}

export async function getGitHistory(path: string): Promise<CommitInfo[]> {
    return invoke<CommitInfo[]>("get_git_history", { path });
}

// ============== GitHub Integration ==============

export async function createGithubRepository(
    token: string,
    name: string,
    description: string | undefined,
    privateRepo: boolean
): Promise<GitHubRepo> {
    return invoke("create_github_repository", {
        token,
        name,
        description,
        private: privateRepo,
    });
}
