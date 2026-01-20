//! Git module types
//!
//! Shared types for Git operations.

use serde::{Deserialize, Serialize};

/// Status of a Git repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryStatus {
    pub branch: String,
    pub is_clean: bool,
    pub ahead: u32,
    pub behind: u32,
    pub staged: Vec<FileChange>,
    pub unstaged: Vec<FileChange>,
    pub untracked: Vec<String>,
    pub conflicts: Vec<FileChange>,
}

impl Default for RepositoryStatus {
    fn default() -> Self {
        Self {
            branch: String::from("unknown"),
            is_clean: true,
            ahead: 0,
            behind: 0,
            staged: Vec::new(),
            unstaged: Vec::new(),
            untracked: Vec::new(),
            conflicts: Vec::new(),
        }
    }
}

/// A changed file in the repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub path: String,
    pub status: FileStatus,
}

/// Status of a file change
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileStatus {
    Added,
    Modified,
    Deleted,
    Renamed,
    Copied,
    Conflicted,
}

/// A Git branch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Branch {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub upstream: Option<String>,
}

/// Information about a commit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub email: String,
    pub timestamp: String,
}
