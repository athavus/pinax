//! Git status module
//!
//! Functions for getting and parsing Git repository status.

use std::path::Path;

use super::executor::{execute_string, GitResult};
use super::types::{FileChange, FileStatus, RepositoryStatus};

/// Get the status of a Git repository
pub async fn get_status(repo_path: &Path) -> GitResult<RepositoryStatus> {
    let mut status = RepositoryStatus::default();

    // Get current branch
    status.branch = get_current_branch(repo_path).await?;

    // Get porcelain status
    let porcelain_output = execute_string(repo_path, &["status", "--porcelain=v1"]).await?;

    // Parse status output
    if porcelain_output.is_empty() {
        status.is_clean = true;
    } else {
        status.is_clean = false;
        parse_porcelain_status(&porcelain_output, &mut status);
    }

    // Get ahead/behind from upstream (if available)
    if let Ok(tracking) = get_tracking_info(repo_path).await {
        status.ahead = tracking.0;
        status.behind = tracking.1;
    }

    Ok(status)
}

/// Get the current branch name
async fn get_current_branch(repo_path: &Path) -> GitResult<String> {
    execute_string(repo_path, &["rev-parse", "--abbrev-ref", "HEAD"]).await
}

/// Get ahead/behind counts from upstream
async fn get_tracking_info(repo_path: &Path) -> GitResult<(u32, u32)> {
    let output = execute_string(
        repo_path,
        &["rev-list", "--left-right", "--count", "@{upstream}...HEAD"],
    )
    .await?;

    let parts: Vec<&str> = output.split_whitespace().collect();
    if parts.len() == 2 {
        let behind = parts[0].parse().unwrap_or(0);
        let ahead = parts[1].parse().unwrap_or(0);
        Ok((ahead, behind))
    } else {
        Ok((0, 0))
    }
}

/// Parse `git status --porcelain=v1` output
fn parse_porcelain_status(output: &str, status: &mut RepositoryStatus) {
    for line in output.lines() {
        if line.len() < 3 {
            continue;
        }

        let index_status = line.chars().nth(0).unwrap_or(' ');
        let worktree_status = line.chars().nth(1).unwrap_or(' ');
        let path = line[3..].to_string();

        // Staged changes (index)
        if index_status != ' ' && index_status != '?' {
            if let Some(file_status) = char_to_file_status(index_status) {
                status.staged.push(FileChange {
                    path: path.clone(),
                    status: file_status,
                });
            }
        }

        // Unstaged changes (worktree)
        if worktree_status != ' ' && worktree_status != '?' {
            if let Some(file_status) = char_to_file_status(worktree_status) {
                status.unstaged.push(FileChange {
                    path: path.clone(),
                    status: file_status,
                });
            }
        }

        // Untracked files
        if index_status == '?' {
            status.untracked.push(path);
        }
    }
}

fn char_to_file_status(c: char) -> Option<FileStatus> {
    match c {
        'A' => Some(FileStatus::Added),
        'M' => Some(FileStatus::Modified),
        'D' => Some(FileStatus::Deleted),
        'R' => Some(FileStatus::Renamed),
        'C' => Some(FileStatus::Copied),
        _ => None,
    }
}
