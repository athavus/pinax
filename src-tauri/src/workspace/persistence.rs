//! Workspace persistence
//!
//! Handles loading and saving workspaces to disk.

use std::path::PathBuf;
use tokio::fs;

use super::types::{Workspace, WorkspaceConfig};

/// Get the path to the workspaces configuration file
fn get_config_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir().ok_or("Could not find config directory")?;
    let app_dir = config_dir.join("pinax");
    Ok(app_dir.join("workspaces.json"))
}

/// Load workspaces from disk
pub async fn load_workspaces() -> Result<Vec<Workspace>, String> {
    let path = get_config_path()?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read workspaces: {}", e))?;

    let config: WorkspaceConfig =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse workspaces: {}", e))?;

    Ok(config.workspaces)
}

/// Save workspaces to disk
pub async fn save_workspaces(workspaces: Vec<Workspace>) -> Result<(), String> {
    let path = get_config_path()?;

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let config = WorkspaceConfig {
        version: 1,
        workspaces,
    };

    let content =
        serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize: {}", e))?;

    fs::write(&path, content)
        .await
        .map_err(|e| format!("Failed to write workspaces: {}", e))?;

    Ok(())
}

/// Create a new workspace
pub async fn create_workspace(name: String) -> Result<Workspace, String> {
    let mut workspaces = load_workspaces().await?;
    let workspace = Workspace::new(name);
    workspaces.push(workspace.clone());
    save_workspaces(workspaces).await?;
    Ok(workspace)
}

/// Add a repository to a workspace
pub async fn add_repository_to_workspace(
    workspace_id: &str,
    repo_path: &str,
) -> Result<(), String> {
    let mut workspaces = load_workspaces().await?;

    let workspace = workspaces
        .iter_mut()
        .find(|w| w.id == workspace_id)
        .ok_or("Workspace not found")?;

    if !workspace.repositories.contains(&repo_path.to_string()) {
        workspace.repositories.push(repo_path.to_string());
    }

    save_workspaces(workspaces).await?;
    Ok(())
}

/// Delete a workspace
pub async fn delete_workspace(workspace_id: String) -> Result<(), String> {
    let mut workspaces = load_workspaces().await?;
    
    if let Some(pos) = workspaces.iter().position(|w| w.id == workspace_id) {
        workspaces.remove(pos);
        save_workspaces(workspaces).await?;
        Ok(())
    } else {
        Err("Workspace not found".to_string())
    }
}
