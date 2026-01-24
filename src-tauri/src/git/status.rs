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
    // First try to get branch name using symbolic-ref (works when on a branch)
    match execute_string(repo_path, &["symbolic-ref", "--short", "HEAD"]).await {
        Ok(branch) => {
            // Clean up any whitespace
            Ok(branch.trim().to_string())
        }
        Err(_) => {
            // If symbolic-ref fails (detached HEAD), try to get branch name from git status
            // git status shows "## HEAD detached at <branch>" when in detached HEAD state
            match execute_string(repo_path, &["status", "--porcelain=branch", "-b"]).await {
                Ok(status) => {
                    // Look for "## HEAD detached at" pattern
                    for line in status.lines() {
                        if line.starts_with("## ") {
                            if line.contains("HEAD detached at") {
                                // Extract branch name after "at "
                                if let Some(start) = line.find("at ") {
                                    let branch_name = line[start + 3..].trim();
                                    // Remove any trailing information (like commit hash)
                                    let branch_name = branch_name.split_whitespace().next().unwrap_or(branch_name);
                                    // Remove any quotes or special characters
                                    let branch_name = branch_name.trim_matches('"').trim_matches('\'');
                                    return Ok(branch_name.to_string());
                                }
                            } else if line.starts_with("## ") && !line.contains("HEAD") {
                                // Normal branch status like "## feature/my-branch"
                                let branch_part = line.trim_start_matches("## ");
                                if let Some(branch) = branch_part.split_whitespace().next() {
                                    return Ok(branch.to_string());
                                }
                            }
                        }
                    }
                }
                Err(_) => {}
            }
            
            // Fallback: try rev-parse --abbrev-ref HEAD
            match execute_string(repo_path, &["rev-parse", "--abbrev-ref", "HEAD"]).await {
                Ok(branch) => {
                    let branch = branch.trim();
                    if branch == "HEAD" {
                        // Still HEAD, try to get from reflog
                        match execute_string(repo_path, &["log", "-1", "--pretty=format:%D"]).await {
                            Ok(refs) => {
                                // Look for branch names in the refs
                                for part in refs.split(',') {
                                    let part = part.trim();
                                    if part.starts_with("HEAD -> ") {
                                        return Ok(part[8..].to_string());
                                    }
                                    if !part.contains("HEAD") && !part.contains("tag:") && part.contains('/') {
                                        // Extract branch name
                                        if let Some(branch) = part.split('/').last() {
                                            return Ok(branch.trim().to_string());
                                        }
                                    }
                                }
                            }
                            Err(_) => {}
                        }
                        Ok("HEAD".to_string())
                    } else {
                        Ok(branch.to_string())
                    }
                }
                Err(e) => {
                    // Handle empty repository (no commits yet)
                    if e.to_string().contains("ambiguous argument 'HEAD'") || e.to_string().contains("unknown revision") {
                        return Ok("No Branch".to_string());
                    }
                    Err(e)
                }
            }
        }
    }
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

        // Check for conflicts first (Unmerged)
        if index_status == 'U' || worktree_status == 'U' || (index_status == 'A' && worktree_status == 'A') || (index_status == 'D' && worktree_status == 'D') {
            status.is_clean = false;
            status.conflicts.push(FileChange {
                path: path.clone(),
                status: FileStatus::Conflicted,
            });
            continue;
        }

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
        'U' => Some(FileStatus::Conflicted),
        _ => None,
    }
}
