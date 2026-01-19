//! Git branches module
//!
//! Functions for listing and working with Git branches.

use std::path::Path;

use super::executor::{execute_string, GitResult};
use super::types::Branch;

/// List all branches in a repository
pub async fn list_branches(repo_path: &Path) -> GitResult<Vec<Branch>> {
    let output = execute_string(repo_path, &["branch", "-a", "--format=%(refname:short)\t%(HEAD)\t%(upstream:short)"]).await?;

    let mut branches = Vec::new();

    for line in output.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.is_empty() {
            continue;
        }

        let name = parts[0].to_string();
        let is_current = parts.get(1).map(|s| *s == "*").unwrap_or(false);
        let upstream = parts.get(2).and_then(|s| {
            if s.is_empty() {
                None
            } else {
                Some(s.to_string())
            }
        });

        let is_remote = name.starts_with("remotes/") || name.starts_with("origin/");

        branches.push(Branch {
            name,
            is_current,
            is_remote,
            upstream,
        });
    }

    Ok(branches)
}
