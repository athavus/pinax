//! Git branches module
//!
//! Functions for listing and working with Git branches.

use std::path::Path;

use super::executor::{execute_string, GitResult};
use super::types::Branch;

/// List all branches in a repository
pub async fn list_branches(repo_path: &Path) -> GitResult<Vec<Branch>> {
    let output = execute_string(repo_path, &["branch", "-a", "--format=%(refname)\t%(HEAD)\t%(upstream:short)"]).await?;

    let mut branches = Vec::new();

    for line in output.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.is_empty() {
            continue;
        }

        let refname = parts[0].to_string();
        let is_current = parts.get(1).map(|s| *s == "*").unwrap_or(false);
        let upstream = parts.get(2).and_then(|s| {
            if s.is_empty() {
                None
            } else {
                Some(s.to_string())
            }
        });

        // refs/heads/master or refs/remotes/origin/master
        let is_remote = refname.starts_with("refs/remotes/");
        
        // Extract short name for display
        let name = if refname.starts_with("refs/heads/") {
            refname.trim_start_matches("refs/heads/").to_string()
        } else if refname.starts_with("refs/remotes/") {
            refname.trim_start_matches("refs/remotes/").to_string()
        } else {
            refname.clone()
        };

        // Filter out HEAD symrefs (e.g. origin/HEAD)
        if name.ends_with("/HEAD") {
            continue;
        }

        branches.push(Branch {
            name,
            is_current,
            is_remote,
            upstream,
        });
    }

    Ok(branches)
}
