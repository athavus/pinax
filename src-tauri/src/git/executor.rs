//! Git CLI executor
//!
//! Low-level module for executing Git commands via the command line.
//! All Git operations go through this module for consistent error handling.

use std::path::Path;
use std::process::Output;
use tokio::process::Command;

/// Result type for Git operations
pub type GitResult<T> = Result<T, GitError>;

/// Error type for Git operations
#[derive(Debug)]
pub struct GitError {
    pub message: String,
    pub command: String,
}

impl std::fmt::Display for GitError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Git error ({}): {}", self.command, self.message)
    }
}

impl std::error::Error for GitError {}

impl From<GitError> for String {
    fn from(err: GitError) -> Self {
        err.to_string()
    }
}

/// Execute a Git command in the specified directory
pub async fn execute(repo_path: &Path, args: &[&str]) -> GitResult<Output> {
    let mut command = Command::new("git");
    let output = command
        .args(args)
        .current_dir(repo_path)
        .envs(std::env::vars())
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_SSH_COMMAND", "ssh -o BatchMode=yes")
        .output()
        .await
        .map_err(|e| GitError {
            message: format!("Failed to execute git: {}", e),
            command: args.join(" "),
        })?;

    Ok(output)
}

/// Execute a Git command and return stdout as a String
pub async fn execute_string(repo_path: &Path, args: &[&str]) -> GitResult<String> {
    let output = execute(repo_path, args).await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: args.join(" "),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.trim().to_string())
}

/// Check if a directory is a Git repository
pub async fn is_git_repo(path: &Path) -> bool {
    let git_dir = path.join(".git");
    git_dir.exists()
}
