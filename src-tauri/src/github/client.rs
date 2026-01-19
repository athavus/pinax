use serde::{Deserialize, Serialize};
use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, USER_AGENT, CONTENT_TYPE};

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
        .headers(headers)
        .json(&payload)
        .send()
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().unwrap_or_default();
        return Err(format!("GitHub API error ({}): {}", status, text));
    }

    let repo = response.json::<GitHubRepo>().map_err(|e| e.to_string())?;
    Ok(repo)
}
