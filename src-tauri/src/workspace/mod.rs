//! Workspace module
//!
//! Logical grouping of repositories with persistence.

pub mod persistence;
pub mod types;

pub use persistence::{add_repository_to_workspace, create_workspace, load_workspaces, delete_workspace};
pub use types::*;
