//! Repository module
//!
//! Handles repository discovery and metadata caching.

pub mod scanner;
pub mod types;

pub use scanner::{scan_repositories, get_repository_info};
pub use types::*;
