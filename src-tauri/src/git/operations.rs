use std::path::Path;
use super::executor::{execute, execute_string, GitResult, GitError};

/// Fetch changes from remote
pub async fn fetch(path: &Path) -> GitResult<()> {
    let output = execute(path, &["fetch", "--all"]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: "fetch".to_string(),
        });
    }
    Ok(())
}

/// Pull changes from remote
pub async fn pull(path: &Path) -> GitResult<()> {
    let output = execute(path, &["pull"]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: "pull".to_string(),
        });
    }
    Ok(())
}

/// Push changes to remote
pub async fn push(path: &Path) -> GitResult<()> {
    let output = execute(path, &["push"]).await?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        // Check if it's a "no upstream" error
        if stderr.contains("has no upstream branch") || stderr.contains("no configured push destination") {
            // Try to get current branch and push with -u origin <branch>
            if let Ok(branch) = execute_string(path, &["rev-parse", "--abbrev-ref", "HEAD"]).await {
                let u_output = execute(path, &["push", "-u", "origin", &branch]).await?;
                if u_output.status.success() {
                    return Ok(());
                }
                
                // If the second attempt also fails, return that error
                let u_stderr = String::from_utf8_lossy(&u_output.stderr);
                return Err(GitError {
                    message: u_stderr.to_string(),
                    command: format!("push -u origin {}", branch),
                });
            }
        }
        
        return Err(GitError {
            message: stderr.to_string(),
            command: "push".to_string(),
        });
    }
    
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
