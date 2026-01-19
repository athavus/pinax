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
            create_workspace,
            delete_workspace,
            add_repository_to_workspace,
            git_fetch,
            git_pull,
            git_push,
            git_commit,
            git_checkout,
            git_create_branch,
            create_github_repository,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
