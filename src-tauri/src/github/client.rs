use serde::{Deserialize, Serialize};
use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, USER_AGENT, CONTENT_TYPE};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRepoRequest {
    pub name: String,
    pub description: Option<String>,
    pub private: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRepo {
    pub id: u64,
    pub name: String,
    pub full_name: String,
    pub html_url: String,
    pub ssh_url: String,
    pub clone_url: String,
}

#[derive(Debug, Deserialize)]
struct GitHubUser {
    login: Option<String>,
    avatar_url: String,
}

#[derive(Debug, Deserialize)]
struct GitHubCommitAuthor {
    author: Option<GitHubUser>,
}

pub fn create_repo(token: &str, name: &str, description: Option<String>, private: bool) -> Result<GitHubRepo, String> {
    let client = Client::new();
    
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(USER_AGENT, HeaderValue::from_static("pinax-desktop"));
    
    let auth_value = format!("Bearer {}", token);
    let mut auth_header = HeaderValue::from_str(&auth_value).map_err(|e| e.to_string())?;
    auth_header.set_sensitive(true);
    headers.insert(AUTHORIZATION, auth_header);

    let payload = CreateRepoRequest {
        name: name.to_string(),
        description,
        private,
    };

    let response = client
        .post("https://api.github.com/user/repos")
        .headers(headers.clone())
        .json(&payload)
        .send()
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().unwrap_or_default();
        
        // Handle "Repository already exists" error (422 Unprocessable Entity)
        if status.as_u16() == 422 && text.contains("name already exists") {
            // Fetch the authenticated user to get their login
            let user_response = client
                .get("https://api.github.com/user")
                .headers(headers.clone())
                .send()
                .map_err(|e| format!("Failed to fetch user for recovery: {}", e))?;
                
            if user_response.status().is_success() {
                let user: GitHubUser = user_response.json().map_err(|e| e.to_string())?;
                if let Some(login) = user.login {
                    // Try to fetch the existing repository
                    let repo_url = format!("https://api.github.com/repos/{}/{}", login, name);
                    let repo_response = client
                        .get(&repo_url)
                        .headers(headers)
                        .send()
                        .map_err(|e| e.to_string())?;
                        
                    if repo_response.status().is_success() {
                        let repo = repo_response.json::<GitHubRepo>().map_err(|e| e.to_string())?;
                        return Ok(repo);
                    }
                }
            }
        }
        
        return Err(format!("GitHub API error ({}): {}", status, text));
    }

    let repo = response.json::<GitHubRepo>().map_err(|e| e.to_string())?;
    Ok(repo)
}

/// Get GitHub avatar URLs for commits using the GitHub API
/// This uses the commits API which returns the avatar directly linked to the commit author
/// 
/// Arguments:
/// - remote_url: The remote URL of the repository (e.g., https://github.com/owner/repo.git)
/// - commit_hashes: List of commit hashes to fetch avatars for
/// 
/// Returns a HashMap of commit_hash -> avatar_url
pub fn get_commit_avatars(remote_url: &str, commit_hashes: Vec<String>) -> HashMap<String, String> {
    let client = Client::new();
    let mut results = HashMap::new();
    
    // Extract owner/repo from remote URL
    let (owner, repo) = match extract_owner_repo(remote_url) {
        Some((o, r)) => (o, r),
        None => return results,
    };
    
    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_static("pinax-desktop"));
    headers.insert(
        reqwest::header::ACCEPT,
        HeaderValue::from_static("application/vnd.github.v3+json"),
    );

    for hash in commit_hashes {
        if let Some(avatar_url) = fetch_commit_avatar(&client, &headers, &owner, &repo, &hash) {
            results.insert(hash, avatar_url);
        }
    }
    
    results
}

/// Extract owner and repo name from a GitHub remote URL
fn extract_owner_repo(remote_url: &str) -> Option<(String, String)> {
    // Handle various GitHub URL formats:
    // - https://github.com/owner/repo.git
    // - https://github.com/owner/repo
    // - git@github.com:owner/repo.git
    // - git@github.com:owner/repo
    
    let url = remote_url.trim();
    
    // Handle SSH format
    if url.starts_with("git@github.com:") {
        let path = url.strip_prefix("git@github.com:")?;
        let path = path.strip_suffix(".git").unwrap_or(path);
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 2 {
            return Some((parts[0].to_string(), parts[1].to_string()));
        }
    }
    
    // Handle HTTPS format
    if url.contains("github.com") {
        // Remove protocol and domain
        let path = url
            .replace("https://", "")
            .replace("http://", "")
            .replace("github.com/", "");
        let path = path.strip_suffix(".git").unwrap_or(&path);
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 2 {
            return Some((parts[0].to_string(), parts[1].to_string()));
        }
    }
    
    None
}

/// Fetch avatar URL for a specific commit from GitHub API
fn fetch_commit_avatar(client: &Client, headers: &HeaderMap, owner: &str, repo: &str, hash: &str) -> Option<String> {
    let url = format!("https://api.github.com/repos/{}/{}/commits/{}", owner, repo, hash);
    
    let response = client
        .get(&url)
        .headers(headers.clone())
        .send()
        .ok()?;
    
    if response.status().is_success() {
        let commit: GitHubCommitAuthor = response.json().ok()?;
        commit.author.map(|a| a.avatar_url)
    } else {
        None
    }
}
