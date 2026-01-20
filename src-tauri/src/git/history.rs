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
