use std::path::Path;
use super::executor::{execute_string, GitResult};
use super::types::CommitInfo;

/// Get the last 50 commits from the repository
pub async fn get_history(repo_path: &Path) -> GitResult<Vec<CommitInfo>> {
    // Format: hash | abbreviation | author | email | timestamp (iso) | message
    let format = "%H\t%h\t%an\t%ae\t%ad\t%s";
    let output = execute_string(
        repo_path, 
        &[
            "log", 
            "-n", "50", 
            "--date=iso-strict", 
            &format!("--format={}", format)
        ]
    ).await?;

    let mut commits = Vec::new();

    for line in output.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() < 6 {
            continue;
        }

        commits.push(CommitInfo {
            hash: parts[0].to_string(),
            short_hash: parts[1].to_string(),
            author: parts[2].to_string(),
            email: parts[3].to_string(),
            timestamp: parts[4].to_string(),
            message: parts[5].to_string(),
        });
    }

    Ok(commits)
}

/// Get files changed in a specific commit
pub async fn get_commit_files(repo_path: &Path, commit_hash: &str) -> GitResult<Vec<super::types::FileChange>> {
    let output = execute_string(
        repo_path,
        &["show", "--name-status", "--oneline", commit_hash]
    ).await?;

    let mut changes = Vec::new();
    // First line is commit info, skip it
    for line in output.lines().skip(1) {
        if line.is_empty() { continue; }
        
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 { continue; }

        let status_code = parts[0].chars().next().unwrap_or('M');
        let path = parts[1].to_string();

        let status = match status_code {
            'A' => super::types::FileStatus::Added,
            'D' => super::types::FileStatus::Deleted,
            'R' => super::types::FileStatus::Renamed,
            'C' => super::types::FileStatus::Copied,
            _ => super::types::FileStatus::Modified,
        };

        changes.push(super::types::FileChange { path, status });
    }

    Ok(changes)
}

/// Get the diff of a specific file in a specific commit
pub async fn get_commit_file_diff(repo_path: &Path, commit_hash: &str, file_path: &str) -> GitResult<String> {
    // We compare the commit with its parent to see what changed in that file
    execute_string(
        repo_path,
        &["diff", "--no-color", &format!("{}~1", commit_hash), commit_hash, "--", file_path]
    ).await
}
