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

/// Stage all and commit changes
pub async fn commit(path: &Path, message: &str) -> GitResult<()> {
    // Stage all changes first
    execute(path, &["add", "-A"]).await?;
    // Then commit
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

/// Get the diff of a specific file
pub async fn get_file_diff(path: &Path, file_path: &str) -> GitResult<String> {
    // Check if staged or unstaged
    // For simplicity, we'll try unstaged first, then staged if empty
    let unstaged = execute_string(path, &["diff", "--no-color", "--", file_path]).await?;
    if !unstaged.is_empty() {
        return Ok(unstaged);
    }
    
    execute_string(path, &["diff", "--cached", "--no-color", "--", file_path]).await
}
