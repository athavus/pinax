use std::path::Path;
use super::executor::{execute, execute_string, GitResult};

/// Fetch changes from remote
pub async fn fetch(path: &Path) -> GitResult<()> {
    execute(path, &["fetch", "--all"]).await?;
    Ok(())
}

/// Pull changes from remote
pub async fn pull(path: &Path) -> GitResult<()> {
    execute(path, &["pull"]).await?;
    Ok(())
}

/// Push changes to remote
pub async fn push(path: &Path) -> GitResult<()> {
    execute(path, &["push"]).await?;
    Ok(())
}

/// Commit staged changes
pub async fn commit(path: &Path, message: &str) -> GitResult<()> {
    execute(path, &["commit", "-m", message]).await?;
    Ok(())
}

/// Checkout a branch
pub async fn checkout(path: &Path, branch_name: &str) -> GitResult<()> {
    execute(path, &["checkout", branch_name]).await?;
    Ok(())
}

/// Create and checkout a new branch
pub async fn create_branch(path: &Path, branch_name: &str) -> GitResult<()> {
    execute(path, &["checkout", "-b", branch_name]).await?;
    Ok(())
}
