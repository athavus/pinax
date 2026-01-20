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
    let output = execute(path, &["commit", "-m", message]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: "commit".to_string(),
        });
    }
    Ok(())
}

/// Undo the last commit (soft reset)
pub async fn undo_commit(path: &Path) -> GitResult<()> {
    let output = execute(path, &["reset", "--soft", "HEAD~1"]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: "reset --soft HEAD~1".to_string(),
        });
    }
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

/// Resolve a merge conflict by choosing a version
pub async fn resolve_conflict(path: &Path, file_path: &str, resolution: &str) -> GitResult<()> {
    let arg = match resolution {
        "ours" => "--ours",
        "theirs" => "--theirs",
        _ => return Err(GitError {
            message: "Invalid resolution".to_string(),
            command: "resolve_conflict".to_string(),
        }),
    };
    
    let output = execute(path, &["checkout", arg, "--", file_path]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: format!("checkout {} -- {}", arg, file_path),
        });
    }
    
    // After checking out the version, we must add it to mark as resolved
    execute(path, &["add", file_path]).await?;
    
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

/// Discard changes in a file
pub async fn discard_changes(path: &Path, file_path: &str) -> GitResult<()> {
    // Try to restore if it's tracked (staged or unstaged)
    let _ = execute(path, &["restore", "--staged", "--worktree", "--", file_path]).await;
    let _ = execute(path, &["restore", "--", file_path]).await;
    
    // Also try to clean if it's untracked
    let _ = execute(path, &["clean", "-f", "--", file_path]).await;
    
    Ok(())
}

/// Add a file pattern to .gitignore
pub async fn add_to_gitignore(path: &Path, file_path: &str) -> GitResult<()> {
    use std::fs::OpenOptions;
    use std::io::Write;
    
    let gitignore_path = path.join(".gitignore");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(gitignore_path)
        .map_err(|e| GitError {
            message: e.to_string(),
            command: "open .gitignore".to_string(),
        })?;
        
    writeln!(file, "{}", file_path).map_err(|e| GitError {
        message: e.to_string(),
        command: "write to .gitignore".to_string(),
    })?;
    
    Ok(())
}

/// Create a branch from a specific commit
pub async fn create_branch_from_commit(path: &Path, branch_name: &str, hash: &str) -> GitResult<()> {
    execute(path, &["branch", branch_name, hash]).await?;
    Ok(())
}

/// Checkout a specific commit (detached HEAD)
pub async fn checkout_commit(path: &Path, hash: &str) -> GitResult<()> {
    execute(path, &["checkout", hash]).await?;
    Ok(())
}

/// Revert a specific commit
pub async fn revert_commit(path: &Path, hash: &str) -> GitResult<()> {
    // --no-edit avoids opening the editor
    let output = execute(path, &["revert", "--no-edit", hash]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: format!("revert {}", hash),
        });
    }
    Ok(())
}

/// Reset to a specific commit (mixed reset by default to preserve working tree)
pub async fn reset_to_commit(path: &Path, hash: &str) -> GitResult<()> {
    // Using mixed reset to keep changes in working directory but unstage them
    execute(path, &["reset", hash]).await?;
    Ok(())
}

/// Cherry-pick a commit
pub async fn cherry_pick_commit(path: &Path, hash: &str) -> GitResult<()> {
    let output = execute(path, &["cherry-pick", hash]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: format!("cherry-pick {}", hash),
        });
    }
    Ok(())
}
/// Initialize a new Git repository
pub async fn init(path: &Path) -> GitResult<()> {
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| GitError {
            message: e.to_string(),
            command: "mkdir -p".to_string(),
        })?;
    }
    
    // Create the directory itself if it doesn't exist
    if !path.exists() {
        std::fs::create_dir_all(path).map_err(|e| GitError {
            message: e.to_string(),
            command: "mkdir".to_string(),
        })?;
    }

    let output = execute(path, &["init"]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: "init".to_string(),
        });
    }
    Ok(())
}

/// Add a remote to the repository
pub async fn remote_add(path: &Path, name: &str, url: &str) -> GitResult<()> {
    let output = execute(path, &["remote", "add", name, url]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: format!("remote add {} {}", name, url),
        });
    }
    Ok(())
}

/// Set a remote URL
pub async fn remote_set_url(path: &Path, name: &str, url: &str) -> GitResult<()> {
    let output = execute(path, &["remote", "set-url", name, url]).await?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: format!("remote set-url {} {}", name, url),
        });
    }
    Ok(())
}

/// Clone a repository
pub async fn clone(url: &str, path: &Path) -> GitResult<()> {
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| GitError {
            message: e.to_string(),
            command: "mkdir -p".to_string(),
        })?;
    }

    // Git clone handles directory creation of the target if it doesn't exist, 
    // but the parent must exist.
    let mut command = tokio::process::Command::new("git");
    let output = command
        .args(&["clone", url, path.to_str().unwrap_or_default()])
        .envs(std::env::vars())
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_SSH_COMMAND", "ssh -o BatchMode=yes")
        .output()
        .await
        .map_err(|e| GitError {
            message: format!("Failed to execute git clone: {}", e),
            command: format!("clone {} {}", url, path.display()),
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError {
            message: stderr.to_string(),
            command: "clone".to_string(),
        });
    }
    Ok(())
}
