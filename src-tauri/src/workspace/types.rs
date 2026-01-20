//! Workspace types

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A logical grouping of repositories
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub repositories: Vec<String>, // Paths to repositories
    pub color: Option<String>,
    pub created_at: String,
}

impl Workspace {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            repositories: Vec::new(),
            color: None,
            created_at: chrono_now(),
        }
    }
}

/// Workspace configuration file format
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkspaceConfig {
    pub version: u32,
    pub workspaces: Vec<Workspace>,
}


/// Get current timestamp as ISO string (simplified without chrono dependency)
fn chrono_now() -> String {
    // Simple timestamp without external dependency
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_secs())
}
