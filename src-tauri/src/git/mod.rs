//! Git module
//!
//! Handles all Git CLI interactions including status, branches, and commits.

pub mod branches;
pub mod executor;
pub mod status;
pub mod types;
pub mod operations;
pub mod history;

pub use branches::list_branches;
pub use executor::is_git_repo;
pub use status::get_status;
pub use history::{get_history, get_commit_files};
pub use types::*;
pub use operations::*;
