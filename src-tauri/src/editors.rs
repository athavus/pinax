use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorInfo {
    pub name: String,
    pub command: String,
    pub icon: Option<String>,
}

pub fn detect_editors() -> Vec<EditorInfo> {
    let mut editors = Vec::new();
    let mut seen_commands = std::collections::HashSet::new();
    
    // 1. Check for common editor binaries in PATH
    let common_binaries = vec![
        ("Visual Studio Code", "code"),
        ("Sublime Text", "subl"),
        ("Zed", "zed"),
        ("Neovim", "nvim"),
        ("Vim", "vim"),
        ("Gedit", "gedit"),
        ("Kate", "kate"),
        ("GNU Emacs", "emacs"),
        ("Antigravity", "antigravity"),
    ];

    for (name, bin) in common_binaries {
        if is_binary_available(bin) {
            editors.push(EditorInfo {
                name: name.to_string(),
                command: bin.to_string(),
                icon: None,
            });
            seen_commands.insert(bin.to_string());
        }
    }

    // 2. Scan .desktop files for more editors
    let desktop_editors = scan_desktop_files();
    for editor in desktop_editors {
        // Resolve absolute path to command name if possible for better de-duplication
        let cmd_key = Path::new(&editor.command)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or(&editor.command)
            .to_string();

        if !seen_commands.contains(&editor.command) && !seen_commands.contains(&cmd_key) {
            editors.push(editor.clone());
            seen_commands.insert(editor.command);
            seen_commands.insert(cmd_key);
        }
    }

    // Sort by name for better UX
    editors.sort_by(|a, b| a.name.cmp(&b.name));
    
    editors
}

fn is_binary_available(bin: &str) -> bool {
    #[cfg(target_os = "windows")]
    let cmd = "where";
    #[cfg(not(target_os = "windows"))]
    let cmd = "which";

    let mut command = Command::new(cmd);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    
    command
        .arg(bin)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn scan_desktop_files() -> Vec<EditorInfo> {
    #[cfg(target_os = "windows")]
    return Vec::new();

    #[cfg(not(target_os = "windows"))]
    {
        let mut editors = Vec::new();
        let search_paths = vec![
            PathBuf::from("/usr/share/applications"),
            dirs::home_dir()
                .map(|h| h.join(".local/share/applications"))
                .unwrap_or_default(),
        ];

        for path in search_paths {
            if !path.exists() {
                continue;
            }

            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("desktop") {
                        if let Some(editor) = parse_desktop_file(&path) {
                            editors.push(editor);
                        }
                    }
                }
            }
        }

        editors
    }
}

fn parse_desktop_file(path: &Path) -> Option<EditorInfo> {
    let content = std::fs::read_to_string(path).ok()?;
    let mut name = None;
    let mut exec = None;
    let mut icon = None;
    let mut is_editor = false;

    for line in content.lines() {
        if line.starts_with("Name=") && name.is_none() {
            name = Some(line[5..].to_string());
        } else if line.starts_with("Exec=") && exec.is_none() {
            // Remove %u, %f, etc. from Exec line
            let full_exec = &line[5..];
            let cmd = full_exec.split_whitespace().next()?.to_string();
            exec = Some(cmd);
        } else if line.starts_with("Icon=") && icon.is_none() {
            icon = Some(line[5..].to_string());
        } else if line.starts_with("MimeType=") {
            if line.contains("text/plain") || line.contains("text/x-") {
                is_editor = true;
            }
        } else if line.starts_with("Categories=") {
            if line.contains("Development") || line.contains("TextEditor") || line.contains("IDE") {
                is_editor = true;
            }
        }
    }

    if is_editor && name.is_some() && exec.is_some() {
        Some(EditorInfo {
            name: name.unwrap(),
            command: exec.unwrap(),
            icon,
        })
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_binary_available() {
        #[cfg(not(target_os = "windows"))]
        assert!(is_binary_available("ls"));
        #[cfg(target_os = "windows")]
        assert!(is_binary_available("cmd"));
        
        // 'non_existent_binary_xyz' should not be available
        assert!(!is_binary_available("non_existent_binary_xyz"));
    }
    
    #[test]
    fn test_detect_editors() {
        let editors = detect_editors();
        // The list might be empty on some systems, but it shouldn't crash
        println!("Detected {} editors", editors.len());
    }
}
