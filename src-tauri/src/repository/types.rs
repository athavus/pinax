//! Repository types

use serde::{Deserialize, Serialize};

use crate::git::CommitInfo;

/// A Git repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repository {
    pub path: String,
    pub name: String,
    pub remote_url: Option<String>,
    pub last_commit: Option<CommitInfo>,
}


