//! Repository scanner
//!
//! Scans directories to discover Git repositories.

use std::path::{Path, PathBuf};
use tokio::fs;

use crate::git;

use super::types::Repository;

/// Maximum depth to scan for repositories
const MAX_SCAN_DEPTH: u32 = 4;

/// Directories to skip during scanning
const SKIP_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "target",
    "build",
    "dist",
    ".cache",
    "vendor",
    "__pycache__",
];

/// Scan a directory for Git repositories
pub async fn scan_repositories(path: &Path) -> Result<Vec<Repository>, String> {
    let mut repos = Vec::new();
    let mut stack: Vec<(PathBuf, u32)> = vec![(path.to_path_buf(), 0)];

    while let Some((current_path, depth)) = stack.pop() {
        if depth > MAX_SCAN_DEPTH {
            continue;
        }

        // Skip if not a directory
        if !current_path.is_dir() {
            continue;
        }

        // Check if this is a Git repository
        if git::is_git_repo(&current_path).await {
            let name = current_path
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            let remote_url = get_remote_url(&current_path).await.ok();

            repos.push(Repository {
                path: current_path.to_string_lossy().to_string(),
                name,
                remote_url,
                last_commit: None,
            });

            // We used to stop here, but now we continue scanning to find nested repos
            // if depth > 0 {
            //    continue;
            // }
        }

        // Read directory entries
        let mut entries = match fs::read_dir(&current_path).await {
            Ok(e) => e,
            Err(_) => continue,
        };

        while let Ok(Some(entry)) = entries.next_entry().await {
            let entry_path = entry.path();

            // Skip hidden directories and known non-repo directories
            if let Some(name) = entry_path.file_name() {
                let name_str = name.to_string_lossy();
                if name_str.starts_with('.') || SKIP_DIRS.contains(&name_str.as_ref()) {
                    continue;
                }
            }

            if entry_path.is_dir() {
                stack.push((entry_path, depth + 1));
            }
        }
    }

    // Sort by name
    repos.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(repos)
}

/// Get the remote URL for a repository
async fn get_remote_url(repo_path: &Path) -> Result<String, String> {
    use crate::git::executor::execute_string;

    execute_string(repo_path, &["remote", "get-url", "origin"])
        .await
        .map_err(|e| e.to_string())
}
