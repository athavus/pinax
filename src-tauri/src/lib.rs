//! Pinax - Keyboard-First Git Workbench
//!
//! Core Rust backend for the Tauri application.

mod git;
mod repository;
mod workspace;
mod github;
mod editors;

use std::path::Path;

// Re-export types for easier access
use git::{Branch, RepositoryStatus};
use repository::Repository;
use workspace::Workspace;

// ============== Tauri Commands ==============

/// Scan a directory for Git repositories
#[tauri::command]
async fn scan_repositories(path: String) -> Result<Vec<Repository>, String> {
    repository::scan_repositories(Path::new(&path)).await
}

#[tauri::command]
async fn get_repository_info(path: String) -> Result<Repository, String> {
    repository::get_repository_info(Path::new(&path)).await
}

/// Get the status of a Git repository
#[tauri::command]
async fn get_repository_status(path: String) -> Result<RepositoryStatus, String> {
    git::get_status(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

/// List all branches in a repository
#[tauri::command]
async fn list_branches(path: String) -> Result<Vec<Branch>, String> {
    git::list_branches(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

/// Get commit history
#[tauri::command]
async fn get_git_history(path: String) -> Result<Vec<git::CommitInfo>, String> {
    git::get_history(Path::new(&path))
        .await
        .map_err(|e| e.to_string())
}

/// Get files changed in a commit
#[tauri::command]
async fn get_commit_files(path: String, hash: String) -> Result<Vec<git::FileChange>, String> {
    git::get_commit_files(Path::new(&path), &hash)
        .await
        .map_err(|e| e.to_string())
}

/// Get diff for a file in a specific commit
#[tauri::command]
async fn get_commit_file_diff(path: String, hash: String, file_path: String) -> Result<String, String> {
    git::get_commit_file_diff(Path::new(&path), &hash, &file_path)
        .await
        .map_err(|e| e.to_string())
}

/// Get all workspaces
#[tauri::command]
async fn get_workspaces() -> Result<Vec<Workspace>, String> {
    workspace::load_workspaces().await
}

/// Create a new workspace
#[tauri::command]
async fn create_workspace(name: String) -> Result<Workspace, String> {
    workspace::create_workspace(name).await
}

/// Add a repository to a workspace
#[tauri::command]
async fn add_repository_to_workspace(workspace_id: String, repo_path: String) -> Result<(), String> {
    workspace::add_repository_to_workspace(&workspace_id, &repo_path).await
}

/// Delete a workspace
#[tauri::command]
async fn delete_workspace(id: String) -> Result<(), String> {
    workspace::delete_workspace(id).await
}

// ============== Git Operations Commands ==============

#[tauri::command]
async fn git_fetch(path: String) -> Result<(), String> {
    git::fetch(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_pull(path: String) -> Result<(), String> {
    git::pull(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_push(path: String) -> Result<(), String> {
    git::push(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_commit(path: String, message: String) -> Result<(), String> {
    git::commit(Path::new(&path), &message).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_checkout(path: String, branch: String) -> Result<(), String> {
    git::checkout(Path::new(&path), &branch).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_create_branch(path: String, branch: String) -> Result<(), String> {
    git::create_branch(Path::new(&path), &branch).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_undo_commit(path: String) -> Result<(), String> {
    git::undo_commit(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_resolve_conflict(path: String, file_path: String, resolution: String) -> Result<(), String> {
    git::resolve_conflict(Path::new(&path), &file_path, &resolution).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_stage_file(path: String, file_path: String) -> Result<(), String> {
    git::stage_file(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_unstage_file(path: String, file_path: String) -> Result<(), String> {
    git::unstage_file(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_stage_all(path: String) -> Result<(), String> {
    // Stage both modified and untracked files
    std::process::Command::new("git")
        .args(&["add", "-A"])
        .current_dir(Path::new(&path))
        .output()
        .map_err(|e| format!("Failed to stage all: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn git_unstage_all(path: String) -> Result<(), String> {
    // Unstage all files
    std::process::Command::new("git")
        .args(&["reset"])
        .current_dir(Path::new(&path))
        .output()
        .map_err(|e| format!("Failed to unstage all: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn get_file_diff(path: String, file_path: String) -> Result<String, String> {
    git::get_file_diff(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_discard_changes(path: String, file_path: String) -> Result<(), String> {
    git::discard_changes(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_add_to_gitignore(path: String, file_path: String) -> Result<(), String> {
    git::add_to_gitignore(Path::new(&path), &file_path).await.map_err(|e| e.to_string())
}


#[tauri::command]
async fn git_create_branch_from_commit(path: String, branch: String, hash: String) -> Result<(), String> {
    git::create_branch_from_commit(Path::new(&path), &branch, &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_checkout_commit(path: String, hash: String) -> Result<(), String> {
    git::checkout_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_revert_commit(path: String, hash: String) -> Result<(), String> {
    git::revert_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_reset_to_commit(path: String, hash: String) -> Result<(), String> {
    git::reset_to_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_cherry_pick_commit(path: String, hash: String) -> Result<(), String> {
    git::cherry_pick_commit(Path::new(&path), &hash).await.map_err(|e| e.to_string())
}
#[tauri::command]
async fn git_init(path: String) -> Result<(), String> {
    git::init(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_remote_add(path: String, name: String, url: String) -> Result<(), String> {
    git::remote_add(Path::new(&path), &name, &url).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_remote_set_url(path: String, name: String, url: String) -> Result<(), String> {
    git::remote_set_url(Path::new(&path), &name, &url).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_clone(url: String, path: String) -> Result<(), String> {
    git::clone(&url, Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn git_push_initial(path: String) -> Result<(), String> {
    git::push_initial(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn is_rebase_or_merge_in_progress(path: String) -> Result<bool, String> {
    git::is_rebase_or_merge_in_progress(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn continue_rebase_or_merge(path: String) -> Result<(), String> {
    git::continue_rebase_or_merge(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn abort_rebase_or_merge(path: String) -> Result<(), String> {
    git::abort_rebase_or_merge(Path::new(&path)).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
async fn generate_templates(
    path: String, 
    readme: bool, 
    gitignore: String, 
    license: bool,
    repo_name: String
) -> Result<(), String> {
    let path = Path::new(&path);
    
    if readme {
        let content = format!("# {}\n\nInitial repository created with Pinax.", repo_name);
        std::fs::write(path.join("README.md"), content).map_err(|e| e.to_string())?;
    }
    
    if !gitignore.is_empty() {
        let content = match gitignore.to_lowercase().as_str() {
            "node" => "node_modules/\ndist/\n.env\n",
            "python" => "__pycache__/\n*.py[cod]\nvenv/\n",
            "rust" => "target/\nCargo.lock\n",
            _ => "node_modules/\ntarget/\nbuild/\ndist/\n.env\n.DS_Store\n",
        };
        std::fs::write(path.join(".gitignore"), content).map_err(|e| e.to_string())?;
    }
    
    if license {
        let content = format!(
"MIT License

Copyright (c) {} Pinax User

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the \"Software\"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.", 
            chrono::Utc::now().format("%Y")
        );
        std::fs::write(path.join("LICENSE"), content).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn setup_github_auth() -> Result<(), String> {
    let output = std::process::Command::new("gh")
        .args(&["auth", "setup-git"])
        .output()
        .map_err(|e| format!("Failed to execute gh auth setup-git: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh auth setup-git failed: {}", stderr));
    }
    Ok(())
}

// ============== GitHub Commands ==============

#[tauri::command]
async fn create_github_repository(token: String, name: String, description: Option<String>, private: bool) -> Result<github::GitHubRepo, String> {
    // Run blocking request in a separate thread to avoid blocking the async runtime
    tauri::async_runtime::spawn_blocking(move || {
        github::create_repo(&token, &name, description, private)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_github_avatars(remote_url: String, commit_hashes: Vec<String>) -> Result<std::collections::HashMap<String, String>, String> {
    // Run blocking requests in a separate thread
    tauri::async_runtime::spawn_blocking(move || {
        Ok(github::get_commit_avatars(&remote_url, commit_hashes))
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn detect_editors() -> Result<Vec<editors::EditorInfo>, String> {
    Ok(editors::detect_editors())
}

#[tauri::command]
async fn open_terminal(path: String) -> Result<(), String> {
    let terminals = vec![
        ("gnome-terminal", vec!["--working-directory", &path]),
        ("konsole", vec!["--workdir", &path]),
        ("xfce4-terminal", vec!["--working-directory", &path]),
        ("terminator", vec!["--working-directory", &path]),
        ("kitty", vec!["--directory", &path]),
        ("alacritty", vec!["--working-directory", &path]),
        ("x-terminal-emulator", vec![]),
    ];

    for (cmd, args) in terminals {
        if std::process::Command::new(cmd).args(args).spawn().is_ok() {
            return Ok(());
        }
    }
    
    Err("No suitable terminal emulator found. Please install gnome-terminal, konsole, or xfce4-terminal.".into())
}

#[tauri::command]
async fn open_in_editor(path: String, preferred_editor: Option<String>) -> Result<(), String> {
    println!("Attempting to open path in editor: {}", path);
    let mut editors = vec![
        ("code", vec![&path]),
        ("subl", vec![&path]),
        ("zed", vec![&path]),
        ("nvim", vec![&path]),
        ("vim", vec![&path]),
        ("antigravity", vec![&path]),
        ("gedit", vec![&path]),
        ("kate", vec![&path]),
        ("mousepad", vec![&path]),
    ];

    // If a preferred editor is specified and not "auto", move it to the front or use it directly
    if let Some(ref pref) = preferred_editor {
        if pref != "auto" && !pref.is_empty() {
            println!("Targeting preferred editor: {}", pref);
            // Try to run the preferred editor directly first
            if pref.contains('/') {
                match std::process::Command::new(pref).arg(&path).status() {
                    Ok(status) if status.success() => return Ok(()),
                    e => println!("Direct path failed: {:?}", e),
                }
            } else {
                // For names, try to launch via shell for better PATH resolution
                let shell_cmd = format!("{} \"{}\"", pref, path);
                match std::process::Command::new("sh").args(["-c", &shell_cmd]).status() {
                    Ok(status) if status.success() => return Ok(()),
                    e => println!("Shell execution failed: {:?}", e),
                }
            }

            // Fallback: move it to the front of our list if we know it
            if let Some(pos) = editors.iter().position(|(cmd, _)| cmd == pref) {
                let item = editors.remove(pos);
                editors.insert(0, item);
            }
        }
    }

    for (cmd, args) in editors {
        match std::process::Command::new(cmd).args(args).status() {
            Ok(status) if status.success() => return Ok(()),
            _ => continue,
        }
    }

    // Try xdg-open as final fallback
    if std::process::Command::new("xdg-open").arg(&path).status().is_ok() {
        return Ok(());
    }

    Err("No suitable code editor found. Please check if your preferred editor is installed and in your PATH.".into())
}

#[tauri::command]
async fn open_file_manager(path: String) -> Result<(), String> {
    std::process::Command::new("xdg-open")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ============== App Entry Point ==============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_repositories,
            get_repository_status,
            list_branches,
            get_repository_info,
            get_workspaces,
            create_workspace,
            delete_workspace,
            add_repository_to_workspace,
            git_fetch,
            git_pull,
            git_push,
            git_commit,
            git_stage_file,
            git_unstage_file,
            git_stage_all,
            git_unstage_all,
            git_checkout,
            git_create_branch,
            git_create_branch_from_commit,
            git_checkout_commit,
            git_revert_commit,
            git_reset_to_commit,
            git_cherry_pick_commit,
            git_undo_commit,
            git_resolve_conflict,
            get_file_diff,
            git_discard_changes,
            git_add_to_gitignore,
            get_git_history,
            get_commit_files,
            get_commit_file_diff,
            create_github_repository,
            get_github_avatars,
            git_init,
            git_remote_add,
            git_remote_set_url,
            git_clone,
            git_push_initial,
            path_exists,
            open_terminal,
            open_in_editor,
            open_file_manager,
            generate_templates,
            setup_github_auth,
            detect_editors,
            is_rebase_or_merge_in_progress,
            continue_rebase_or_merge,
            abort_rebase_or_merge,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
