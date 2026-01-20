//! Pinax - Keyboard-First Git Workbench
//!
//! Core Rust backend for the Tauri application.

mod git;
mod repository;
mod workspace;
mod github;

use std::path::Path;

// Re-export types for easier access
use git::{Branch, RepositoryStatus};
use repository::Repository;
use workspace::Workspace;

// ============== Tauri Commands ==============

/// Scan a directory for Git repositories
#[tauri::command]
async fn scan_repositories(path: String) -> Result<Vec<Repository>, String> {
    repository::scan_repositories(Path::new(&path)).await
}

/// Get the status of a Git repository
#[tauri::command]
async fn get_repository_status(path: String) -> Result<RepositoryStatus, String> {
    git::get_status(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

/// List all branches in a repository
#[tauri::command]
async fn list_branches(path: String) -> Result<Vec<Branch>, String> {
    git::list_branches(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

/// Get commit history
#[tauri::command]
async fn get_git_history(path: String) -> Result<Vec<git::CommitInfo>, String> {
    git::get_history(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

/// Get all workspaces
#[tauri::command]
async fn get_workspaces() -> Result<Vec<Workspace>, String> {
    workspace::load_workspaces().await
}

/// Create a new workspace
#[tauri::command]
async fn create_workspace(name: String) -> Result<Workspace, String> {
    workspace::create_workspace(name).await
}

/// Add a repository to a workspace
#[tauri::command]
async fn add_repository_to_workspace(workspace_id: String, repo_path: String) -> Result<(), String> {
    workspace::add_repository_to_workspace(&workspace_id, &repo_path).await
}

/// Delete a workspace
#[tauri::command]
async fn delete_workspace(id: String) -> Result<(), String> {
    workspace::delete_workspace(id).await
}

// ============== Git Operations Commands ==============

#[tauri::command]
async fn git_fetch(path: String) -> Result<(), String> {
    git::fetch(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_pull(path: String) -> Result<(), String> {
    git::pull(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_push(path: String) -> Result<(), String> {
    git::push(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_commit(path: String, message: String) -> Result<(), String> {
    git::commit(Path::new(&path), &message).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_checkout(path: String, branch: String) -> Result<(), String> {
    git::checkout(Path::new(&path), &branch).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_create_branch(path: String, branch: String) -> Result<(), String> {
    git::create_branch(Path::new(&path), &branch).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_undo_commit(path: String) -> Result<(), String> {
    git::undo_commit(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_resolve_conflict(path: String, file_path: String, resolution: String) -> Result<(), String> {
    git::resolve_conflict(Path::new(&path), &file_path, &resolution).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_file_diff(path: String, file_path: String) -> Result<String, String> {
    git::get_file_diff(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_discard_changes(path: String, file_path: String) -> Result<(), String> {
    git::discard_changes(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_add_to_gitignore(path: String, file_path: String) -> Result<(), String> {
    git::add_to_gitignore(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}


#[tauri::command]
async fn git_create_branch_from_commit(path: String, branch: String, hash: String) -> Result<(), String> {
    git::create_branch_from_commit(Path::new(&path), &branch, &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_checkout_commit(path: String, hash: String) -> Result<(), String> {
    git::checkout_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_revert_commit(path: String, hash: String) -> Result<(), String> {
    git::revert_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_reset_to_commit(path: String, hash: String) -> Result<(), String> {
    git::reset_to_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_cherry_pick_commit(path: String, hash: String) -> Result<(), String> {
    git::cherry_pick_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

// ============== GitHub Commands ==============

#[tauri::command]
async fn create_github_repository(token: String, name: String, description: Option<String>, private: bool) -> Result<github::GitHubRepo, String> {
    // Run blocking request in a separate thread to avoid blocking the async runtime
    tauri::async_runtime::spawn_blocking(move || {
        github::create_repo(&token, &name, description, private)
    }).await.map_err(|e| e.to_string())?
}

// ============== App Entry Point ==============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_repositories,
            get_repository_status,
            list_branches,
            get_workspaces,
            create_workspace,
            delete_workspace,
            add_repository_to_workspace,
            git_fetch,
            git_pull,
            git_push,
            git_commit,
            git_checkout,
            git_create_branch,
            git_create_branch_from_commit,
            git_checkout_commit,
            git_revert_commit,
            git_reset_to_commit,
            git_cherry_pick_commit,
            git_undo_commit,
            git_resolve_conflict,
            get_file_diff,
            git_discard_changes,
            git_add_to_gitignore,
            get_git_history,
            create_github_repository,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
