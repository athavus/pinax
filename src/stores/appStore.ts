/**
 * Global application state using Zustand
 * Keeps track of current selections and UI state
 */

import { create } from "zustand";
import type { Repository, RepositoryStatus, Workspace, NavigationContext, Branch, CommitInfo, FileChange } from "@/types";
import {
    getRepositoryStatus,
    getRepositoryInfo,
    getWorkspaces,
    scanRepositories,
    createWorkspace,
    gitFetch,
    gitPull,
    gitPush,
    gitCommit,
    gitStageFile,
    gitUnstageFile,
    gitCheckout,
    gitCreateBranch,
    gitUndoCommit,
    gitResolveConflict,
    gitDiscardChanges,
    gitAddToGitignore,
    listBranches,
    getGitHistory,
    createGithubRepository,
    addRepositoryToWorkspace,
    deleteWorkspace,
    gitCreateBranchFromCommit,
    gitCheckoutCommit,
    gitRevertCommit,
    gitResetToCommit,
    gitCherryPickCommit,
    gitInit,
    gitRemoteAdd,
    gitRemoteSetUrl,
    gitClone,
    gitPushInitial,
    generateTemplates,
} from "@/lib/tauri";

interface AppState {
    // Workspaces
    workspaces: Workspace[];
    selectedWorkspaceId: string | null;

    // Repositories
    repositories: Repository[];
    selectedRepositoryPath: string | null;
    repositoryStatus: RepositoryStatus | null;
    selectedFile: string | null;
    selectedFileDiff: string | null;

    // UI state
    navigationContext: NavigationContext;
    isLoading: boolean;
    isFetching: boolean;
    isPulling: boolean;
    isPushing: boolean;
    branches: Branch[];
    commits: CommitInfo[];
    selectedCommitHash: string | null;
    selectedCommitFiles: FileChange[];
    hiddenRepositories: string[];
    error: string | null;

    // Settings
    settings: {
        githubToken: string;
        preferredEditor: string;
    };

    // Actions
    setSelectedWorkspace: (id: string | null) => void;
    createWorkspace: (name: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    setSelectedRepository: (path: string | null) => void;
    setSelectedFile: (path: string | null) => Promise<void>;
    addRepositoryToWorkspace: (workspaceId: string, repoPath: string) => Promise<void>;
    hideRepository: (path: string) => void;
    loadCommitFiles: (hash: string) => Promise<void>;

    // Git Operations
    fetch: () => Promise<void>;
    pull: () => Promise<void>;
    push: () => Promise<void>;
    commit: (message: string) => Promise<void>;
    checkout: (branch: string) => Promise<void>;
    createBranch: (branch: string) => Promise<void>;
    loadBranches: () => Promise<void>;
    loadHistory: () => Promise<void>;
    undoCommit: () => Promise<void>;
    resolveConflict: (filePath: string, resolution: "ours" | "theirs") => Promise<void>;
    discardChanges: (filePath: string) => Promise<void>;
    addToGitignore: (filePath: string) => Promise<void>;
    createBranchFromCommit: (branch: string, hash: string) => Promise<void>;
    checkoutCommit: (hash: string) => Promise<void>;
    revertCommit: (hash: string) => Promise<void>;
    resetToCommit: (hash: string) => Promise<void>;
    cherryPickCommit: (hash: string) => Promise<void>;
    stageFile: (filePath: string) => Promise<void>;
    unstageFile: (filePath: string) => Promise<void>;


    // GitHub Integration
    createGithubRepository: (token: string, name: string, description: string | undefined, isPrivate: boolean) => Promise<void>;
    publishRepository: (
        localPath: string,
        name: string,
        token: string,
        description: string | undefined,
        isPrivate: boolean,
        templates?: { readme: boolean; gitignore: string; license: boolean }
    ) => Promise<void>;
    cloneRepository: (url: string, localPath: string) => Promise<void>;
    addLocalRepository: (localPath: string) => Promise<void>;
    successAlert: { title: string; message: string } | null;
    clearSuccessAlert: () => void;
    setNavigationContext: (context: NavigationContext) => void;
    loadWorkspaces: () => Promise<void>;
    scanForRepositories: (path: string) => Promise<void>;
    refreshRepositoryStatus: () => Promise<void>;
    pollRepositoryStatus: () => Promise<void>;
    clearError: () => void;
    updateSettings: (settings: Partial<AppState["settings"]>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    workspaces: [],
    selectedWorkspaceId: "uncategorized",
    repositories: [],
    selectedRepositoryPath: null,
    repositoryStatus: null,
    selectedFile: null,
    selectedFileDiff: null,
    navigationContext: "sidebar",
    isLoading: false,
    isFetching: false,
    isPulling: false,
    isPushing: false,
    branches: [],
    commits: [],
    selectedCommitHash: null,
    selectedCommitFiles: [],
    hiddenRepositories: JSON.parse(localStorage.getItem("hidden_repositories") || "[]"),
    error: null,
    successAlert: null,

    // Initial settings from localStorage
    settings: {
        githubToken: localStorage.getItem("github_token") || "",
        preferredEditor: localStorage.getItem("preferred_editor") || "auto",
    },

    // Actions
    setSelectedWorkspace: (id) => set({ selectedWorkspaceId: id }),

    createWorkspace: async (name) => {
        set({ isLoading: true });
        try {
            await createWorkspace(name);
            // Reload workspaces
            const workspaces = await getWorkspaces();
            set({ workspaces, isLoading: false });
        } catch (error) {
            set({
                error: `Failed to create workspace: ${error}`,
                isLoading: false
            });
        }
    },

    deleteWorkspace: async (id) => {
        set({ isLoading: true });
        try {
            await deleteWorkspace(id);
            // Reload workspaces
            const workspaces = await getWorkspaces();
            set({ workspaces, isLoading: false });

            // If deleted workspace was selected, deselect it
            if (get().selectedWorkspaceId === id) {
                set({ selectedWorkspaceId: null });
            }
        } catch (error) {
            set({
                error: `Failed to delete workspace: ${error}`,
                isLoading: false
            });
        }
    },

    setSelectedRepository: async (path) => {
        set({ selectedRepositoryPath: path, selectedFile: null, selectedFileDiff: null, isLoading: true });
        if (path) {
            try {
                const status = await getRepositoryStatus(path);
                const allBranches = await listBranches(path);
                // Include both local and remote branches as requested
                const branches = allBranches.filter(b => b.name !== "HEAD");
                set({ repositoryStatus: status, branches, isLoading: false });
                await get().loadHistory();
            } catch (error) {
                set({
                    error: `Failed to get repository status: ${error}`,
                    isLoading: false,
                });
            }
        } else {
            set({ repositoryStatus: null, branches: [], isLoading: false });
        }
    },

    setSelectedFile: async (filePath) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath || !filePath) {
            set({ selectedFile: null, selectedFileDiff: null });
            return;
        }

        set({ selectedFile: filePath, isLoading: true });
        try {
            const { getFileDiff, getCommitFileDiff } = await import("@/lib/tauri");

            let diff;
            if (get().selectedCommitHash) {
                diff = await getCommitFileDiff(selectedRepositoryPath, get().selectedCommitHash!, filePath);
            } else {
                diff = await getFileDiff(selectedRepositoryPath, filePath);
            }

            set({ selectedFileDiff: diff, isLoading: false });
        } catch (error) {
            set({ error: `Failed to load file diff: ${error}`, isLoading: false });
        }
    },

    // Git Operations Implementation
    fetch: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isFetching: true, isLoading: true });
        try {
            await gitFetch(selectedRepositoryPath);
            // Refresh status after fetch
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isFetching: false, isLoading: false });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Fetch failed: ${error}`, isFetching: false, isLoading: false });
        }
    },

    pull: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isPulling: true, isLoading: true });
        try {
            await gitPull(selectedRepositoryPath);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isPulling: false, isLoading: false, selectedFile: null, selectedFileDiff: null });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Pull failed: ${error}`, isPulling: false, isLoading: false });
        }
    },

    push: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isPushing: true, isLoading: true });
        try {
            await gitPush(selectedRepositoryPath);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isPushing: false, isLoading: false, selectedFile: null, selectedFileDiff: null });
            await get().loadHistory();
        } catch (error) {
            const errorMessage = String(error);
            if (errorMessage.includes("non-fast-forward") || errorMessage.includes("rejected")) {
                set({ error: "Push rejected: Remote changes detected. Please pull first.", isPushing: false, isLoading: false });
            } else {
                set({ error: `Push failed: ${errorMessage}`, isPushing: false, isLoading: false });
            }
        }
    },

    commit: async (message) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitCommit(selectedRepositoryPath, message);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false, selectedFile: null, selectedFileDiff: null });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Commit failed: ${error}`, isLoading: false });
        }
    },

    checkout: async (branch) => {
        const { selectedRepositoryPath, loadBranches } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true, selectedFile: null, selectedFileDiff: null });
        try {
            await gitCheckout(selectedRepositoryPath, branch);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
            await loadBranches();
        } catch (error) {
            set({ error: `Checkout failed: ${error}`, isLoading: false });
        }
    },

    createBranch: async (branch) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitCreateBranch(selectedRepositoryPath, branch);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            const branches = await listBranches(selectedRepositoryPath);
            set({ repositoryStatus: status, branches, isLoading: false });
        } catch (error) {
            set({ error: `Create branch failed: ${error}`, isLoading: false });
        }
    },

    loadBranches: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        try {
            const allBranches = await listBranches(selectedRepositoryPath);
            const branches = allBranches.filter(b => b.name !== "HEAD");
            set({ branches });
        } catch (error) {
            console.error("Failed to load branches:", error);
        }
    },

    undoCommit: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitUndoCommit(selectedRepositoryPath);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Undo commit failed: ${error}`, isLoading: false });
        }
    },

    resolveConflict: async (filePath: string, resolution: "ours" | "theirs") => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitResolveConflict(selectedRepositoryPath, filePath, resolution);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
        } catch (error) {
            set({ error: `Conflict resolution failed: ${error}`, isLoading: false });
        }
    },

    discardChanges: async (filePath: string) => {
        const { selectedRepositoryPath, refreshRepositoryStatus } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitDiscardChanges(selectedRepositoryPath, filePath);
            if (get().selectedFile === filePath) {
                set({ selectedFile: null, selectedFileDiff: null });
            }
            await refreshRepositoryStatus();
        } catch (error) {
            set({ error: `Discard failed: ${error}`, isLoading: false });
        }
    },

    addToGitignore: async (filePath: string) => {
        const { selectedRepositoryPath, refreshRepositoryStatus } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitAddToGitignore(selectedRepositoryPath, filePath);
            await refreshRepositoryStatus();
        } catch (error) {
            set({ error: `Add to gitignore failed: ${error}`, isLoading: false });
        }
    },

    createBranchFromCommit: async (branch, hash) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitCreateBranchFromCommit(selectedRepositoryPath, branch, hash);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            const branches = await listBranches(selectedRepositoryPath);
            set({ repositoryStatus: status, branches, isLoading: false });
        } catch (error) {
            set({ error: `Create branch from commit failed: ${error}`, isLoading: false });
        }
    },

    checkoutCommit: async (hash) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitCheckoutCommit(selectedRepositoryPath, hash);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Checkout commit failed: ${error}`, isLoading: false });
        }
    },

    revertCommit: async (hash) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitRevertCommit(selectedRepositoryPath, hash);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Revert commit failed: ${error}`, isLoading: false });
        }
    },

    resetToCommit: async (hash) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitResetToCommit(selectedRepositoryPath, hash);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Reset to commit failed: ${error}`, isLoading: false });
        }
    },

    cherryPickCommit: async (hash) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitCherryPickCommit(selectedRepositoryPath, hash);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
            await get().loadHistory();
        } catch (error) {
            set({ error: `Cherry-pick failed: ${error}`, isLoading: false });
        }
    },

    stageFile: async (filePath) => {
        const { selectedRepositoryPath, refreshRepositoryStatus } = get();
        if (!selectedRepositoryPath) return;
        try {
            await gitStageFile(selectedRepositoryPath, filePath);
            await refreshRepositoryStatus();
        } catch (error) {
            set({ error: `Failed to stage file: ${error}` });
        }
    },

    unstageFile: async (filePath) => {
        const { selectedRepositoryPath, refreshRepositoryStatus } = get();
        if (!selectedRepositoryPath) return;
        try {
            await gitUnstageFile(selectedRepositoryPath, filePath);
            await refreshRepositoryStatus();
        } catch (error) {
            set({ error: `Failed to unstage file: ${error}` });
        }
    },

    createGithubRepository: async (token, name, description, isPrivate) => {
        set({ isLoading: true });
        try {
            await createGithubRepository(token, name, description, isPrivate);
            set({ isLoading: false });
        } catch (error) {
            set({ error: `Failed to create GitHub repository: ${error}`, isLoading: false });
            throw error;
        }
    },

    publishRepository: async (localPath, name, token, description, isPrivate, templates) => {
        set({ isLoading: true });
        try {
            // 1. Create GitHub repository
            const ghRepo = await createGithubRepository(token, name, description, isPrivate);

            // 2. Initialize local repository if not already one
            await gitInit(localPath);

            // 3. Generate templates if requested
            if (templates) {
                await generateTemplates(
                    localPath,
                    templates.readme,
                    templates.gitignore,
                    templates.license,
                    name
                );
            }

            // 4. Add remote with token for authentication
            // clone_url format: https://github.com/user/repo.git
            const authenticatedUrl = ghRepo.clone_url.replace("https://", `https://${token}@`);

            try {
                await gitRemoteAdd(localPath, "origin", authenticatedUrl);
            } catch (e) {
                // If remote already exists, try to set it
                await gitRemoteSetUrl(localPath, "origin", authenticatedUrl);
            }

            // 5. Initial commit (if there are files)
            try {
                const status = await getRepositoryStatus(localPath);
                if (status.untracked.length > 0 || status.unstaged.length > 0 || (templates && (templates.readme || templates.gitignore !== "" || templates.license))) {
                    await gitCommit(localPath, "Initial commit from Pinax");
                }
            } catch (e) {
                console.warn("Initial commit failed:", e);
            }

            // 6. Push with token auth (now handled by the remote URL)
            let pushError = null;
            try {
                await gitPushInitial(localPath);
            } catch (e) {
                console.error("Initial push failed:", e);
                pushError = e;
            }

            // 7. Add to current workspace and update state regardless of push success
            const workspaceId = get().selectedWorkspaceId;
            if (workspaceId && workspaceId !== "uncategorized") {
                try {
                    await addRepositoryToWorkspace(workspaceId, localPath);
                } catch (e) {
                    console.warn(`Failed to add to workspace ${workspaceId}:`, e);
                }
            }

            await get().setSelectedRepository(localPath);

            // Update local state for immediate UI refresh
            try {
                const newRepo = await getRepositoryInfo(localPath);
                const { repositories } = get();
                if (!repositories.some(r => r.path === localPath)) {
                    set({ repositories: [...repositories, newRepo].sort((a, b) => a.name.localeCompare(b.name)) });
                }
            } catch (e) {
                console.error("Failed to fetch new repository info:", e);
                await get().loadWorkspaces();
            }

            set({
                isLoading: false,
                successAlert: pushError ? {
                    title: "Created Locally",
                    message: `Successfully created "${name}" locally, but initial push to GitHub failed. You can push manually once you check your credentials.`
                } : {
                    title: "Repository Published",
                    message: `Successfully created and published "${name}" to GitHub.`
                }
            });
        } catch (error) {
            set({ error: `Publish failed: ${error}`, isLoading: false });
            throw error;
        }
    },

    cloneRepository: async (url, localPath) => {
        set({ isLoading: true });
        try {
            await gitClone(url, localPath);

            const workspaceId = get().selectedWorkspaceId;
            if (workspaceId && workspaceId !== "uncategorized") {
                try {
                    await addRepositoryToWorkspace(workspaceId, localPath);
                } catch (e) {
                    console.warn(`Failed to add to workspace ${workspaceId}:`, e);
                }
            }
            await get().setSelectedRepository(localPath);

            // Fetch info and update state
            try {
                const newRepo = await getRepositoryInfo(localPath);
                const { repositories } = get();
                if (!repositories.some(r => r.path === localPath)) {
                    set({ repositories: [...repositories, newRepo].sort((a, b) => a.name.localeCompare(b.name)) });
                }
            } catch (e) {
                console.error("Failed to fetch new repository info:", e);
                await get().loadWorkspaces();
            }

            set({
                isLoading: false,
                successAlert: {
                    title: "Repository Cloned",
                    message: `Successfully cloned repository to ${localPath}.`
                }
            });
        } catch (error) {
            set({ error: `Clone failed: ${error}`, isLoading: false });
            throw error;
        }
    },

    addLocalRepository: async (localPath) => {
        set({ isLoading: true });
        try {
            const workspaceId = get().selectedWorkspaceId;
            if (workspaceId && workspaceId !== "uncategorized") {
                try {
                    await addRepositoryToWorkspace(workspaceId, localPath);
                } catch (e) {
                    console.warn(`Failed to add to workspace ${workspaceId}:`, e);
                }
            }
            await get().setSelectedRepository(localPath);

            // Fetch info and update state
            try {
                const newRepo = await getRepositoryInfo(localPath);
                const { repositories } = get();
                if (!repositories.some(r => r.path === localPath)) {
                    set({ repositories: [...repositories, newRepo].sort((a, b) => a.name.localeCompare(b.name)) });
                }
            } catch (e) {
                console.error("Failed to fetch new repository info:", e);
                await get().loadWorkspaces();
            }

            set({
                isLoading: false,
                successAlert: {
                    title: "Repository Added",
                    message: `Successfully added ${localPath} to your workspace.`
                }
            });
        } catch (error) {
            set({ error: `Failed to add repository: ${error}`, isLoading: false });
            throw error;
        }
    },

    clearSuccessAlert: () => set({ successAlert: null }),

    addRepositoryToWorkspace: async (workspaceId, repoPath) => {
        if (workspaceId === "uncategorized") return;
        try {
            await addRepositoryToWorkspace(workspaceId, repoPath);
            await get().loadWorkspaces();
        } catch (error) {
            set({ error: `Failed to add repository to workspace: ${error}` });
        }
    },

    hideRepository: (path) => {
        const { hiddenRepositories } = get();
        if (!hiddenRepositories.includes(path)) {
            const newHidden = [...hiddenRepositories, path];
            set({ hiddenRepositories: newHidden });
            localStorage.setItem("hidden_repositories", JSON.stringify(newHidden));
        }
    },

    loadCommitFiles: async (hash) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ selectedCommitHash: hash, isLoading: true });
        try {
            const { getCommitFiles } = await import("@/lib/tauri");
            const files = await getCommitFiles(selectedRepositoryPath, hash);
            set({ selectedCommitFiles: files, isLoading: false });
        } catch (error) {
            set({ error: `Failed to load commit files: ${error}`, isLoading: false });
        }
    },


    setNavigationContext: (context) => set({ navigationContext: context }),

    loadWorkspaces: async () => {
        set({ isLoading: true });
        try {
            const workspaces = await getWorkspaces();
            set({ workspaces, isLoading: false });
        } catch (error) {
            // Expected to fail initially - workspaces may not exist yet
            set({ workspaces: [], isLoading: false });
        }
    },

    scanForRepositories: async (path) => {
        set({ isLoading: true });
        try {
            const repositories = await scanRepositories(path);
            set({ repositories, isLoading: false });
        } catch (error) {
            set({
                error: `Failed to scan repositories: ${error}`,
                repositories: [],
                isLoading: false,
            });
        }
    },

    refreshRepositoryStatus: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;

        set({ isLoading: true });
        try {
            const status = await getRepositoryStatus(selectedRepositoryPath);
            const { selectedFile } = get();

            // Check if selected file still exists in the new status
            const stillExists = status.staged.find(f => f.path === selectedFile) ||
                status.unstaged.find(f => f.path === selectedFile) ||
                status.untracked.includes(selectedFile || "");

            if (!stillExists) {
                set({ selectedFile: null, selectedFileDiff: null });
            }

            set({ repositoryStatus: status, isLoading: false });
        } catch (error) {
            set({
                error: `Failed to refresh status: ${error}`,
                isLoading: false,
            });
        }
    },

    pollRepositoryStatus: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;

        // No loading state for polling
        try {
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status });
        } catch (error) {
            // Silent error failure for polling to avoid pestering user
            console.error("Polling failed:", error);
        }
    },

    loadHistory: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        try {
            const commits = await getGitHistory(selectedRepositoryPath);
            set({ commits });
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    },

    clearError: () => set({ error: null }),

    updateSettings: (newSettings) => {
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings, ...newSettings };

        // Persist to localStorage
        if (newSettings.githubToken !== undefined) {
            localStorage.setItem("github_token", newSettings.githubToken);
        }
        if (newSettings.preferredEditor !== undefined) {
            localStorage.setItem("preferred_editor", newSettings.preferredEditor);
        }

        set({ settings: updatedSettings });
    },
}));
