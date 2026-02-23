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
    pub exit_code: Option<i32>,
}

impl std::fmt::Display for GitError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self.exit_code {
            Some(code) => write!(f, "Git error ({}) [exit {}]: {}", self.command, code, self.message),
            None => write!(f, "Git error ({}): {}", self.command, self.message),
        }
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
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000);

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
            exit_code: None,
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
            exit_code: output.status.code(),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.trim_end().to_string())
}

/// Execute a global Git command and return stdout as a String
pub async fn execute_global_string(args: &[&str]) -> GitResult<String> {
    let mut command = Command::new("git");
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000);

    let output = command
        .args(args)
        .envs(std::env::vars())
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_SSH_COMMAND", "ssh -o BatchMode=yes")
        .output()
        .await
        .map_err(|e| GitError {
            message: format!("Failed to execute git: {}", e),
            command: args.join(" "),
            exit_code: None,
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: args.join(" "),
            exit_code: output.status.code(),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.trim_end().to_string())
}

/// Check if a directory is a Git repository
pub async fn is_git_repo(path: &Path) -> bool {
    let git_dir = path.join(".git");
    git_dir.exists()
}
