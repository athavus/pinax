/**
 * Typed wrappers for Tauri IPC commands
 * Provides type-safe communication between React and Rust
 */

import { invoke } from "@tauri-apps/api/core";
import type { Repository, RepositoryStatus, Branch, Workspace, GitHubRepo, CommitInfo, FileChange } from "@/types";

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
 * Get metadata for a single repository
 */
export async function getRepositoryInfo(path: string): Promise<Repository> {
    return invoke<Repository>("get_repository_info", { path });
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

export async function gitPushInitial(path: string): Promise<void> {
    return invoke("git_push_initial", { path });
}

export async function gitCommit(path: string, message: string): Promise<void> {
    return invoke("git_commit", { path, message });
}

export async function gitStageFile(path: string, filePath: string): Promise<void> {
    return invoke("git_stage_file", { path, filePath });
}

export async function gitUnstageFile(path: string, filePath: string): Promise<void> {
    return invoke("git_unstage_file", { path, filePath });
}

export async function gitStageAll(path: string): Promise<void> {
    return invoke("git_stage_all", { path });
}

export async function gitUnstageAll(path: string): Promise<void> {
    return invoke("git_unstage_all", { path });
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

export async function getCommitFiles(path: string, hash: string): Promise<FileChange[]> {
    return invoke<FileChange[]>("get_commit_files", { path, hash });
}

export async function getCommitFileDiff(path: string, hash: string, filePath: string): Promise<string> {
    return invoke<string>("get_commit_file_diff", { path, hash, filePath });
}

export async function gitDiscardChanges(path: string, filePath: string): Promise<void> {
    return invoke("git_discard_changes", { path, filePath });
}

export async function gitAddToGitignore(path: string, filePath: string): Promise<void> {
    return invoke("git_add_to_gitignore", { path, filePath });
}

export async function gitCreateBranchFromCommit(path: string, branch: string, hash: string): Promise<void> {
    return invoke("git_create_branch_from_commit", { path, branch, hash });
}

export async function gitCheckoutCommit(path: string, hash: string): Promise<void> {
    return invoke("git_checkout_commit", { path, hash });
}

export async function gitRevertCommit(path: string, hash: string): Promise<void> {
    return invoke("git_revert_commit", { path, hash });
}

export async function gitResetToCommit(path: string, hash: string): Promise<void> {
    return invoke("git_reset_to_commit", { path, hash });
}

export async function gitCherryPickCommit(path: string, hash: string): Promise<void> {
    return invoke("git_cherry_pick_commit", { path, hash });
}

export async function gitInit(path: string): Promise<void> {
    return invoke("git_init", { path });
}

export async function gitRemoteAdd(path: string, name: string, url: string): Promise<void> {
    return invoke("git_remote_add", { path, name, url });
}

export async function gitRemoteSetUrl(path: string, name: string, url: string): Promise<void> {
    return invoke("git_remote_set_url", { path, name, url });
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

export async function getGithubAvatars(remoteUrl: string, commitHashes: string[]): Promise<Record<string, string>> {
    return invoke("get_github_avatars", { remoteUrl, commitHashes });
}

export async function gitClone(url: string, path: string): Promise<void> {
    return await invoke("git_clone", { url, path });
}

export async function generateTemplates(
    path: string,
    readme: boolean,
    gitignore: string,
    license: boolean,
    repoName: string
): Promise<void> {
    return await invoke("generate_templates", { path, readme, gitignore, license, repoName });
}

export async function setupGithubAuth(): Promise<void> {
    return await invoke("setup_github_auth");
}

export interface EditorInfo {
    name: String;
    command: String;
    icon?: String;
}

export async function detectEditors(): Promise<EditorInfo[]> {
    return await invoke<EditorInfo[]>("detect_editors");
}

export async function openInEditor(path: String, preferredEditor?: String): Promise<void> {
    return await invoke("open_in_editor", { path, preferredEditor });
}

export async function isRebaseOrMergeInProgress(path: string): Promise<boolean> {
    return invoke<boolean>("is_rebase_or_merge_in_progress", { path });
}

export async function continueRebaseOrMerge(path: string): Promise<void> {
    return invoke("continue_rebase_or_merge", { path });
}

export async function abortRebaseOrMerge(path: string): Promise<void> {
    return invoke("abort_rebase_or_merge", { path });
}
