//! Git module
//!
//! Handles all Git CLI interactions including status, branches, and commits.

pub mod branches;
pub mod executor;
pub mod status;
pub mod types;
pub mod operations;

pub use branches::list_branches;
pub use executor::is_git_repo;
pub use status::get_status;
pub use types::*;
pub use operations::*;
