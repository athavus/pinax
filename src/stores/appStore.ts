/**
 * Global application state using Zustand
 * Keeps track of current selections and UI state
 */

import { create } from "zustand";
import type { Repository, RepositoryStatus, Workspace, NavigationContext, Branch, CommitInfo } from "@/types";
import {
    getRepositoryStatus,
    getWorkspaces,
    scanRepositories,
    createWorkspace,
    gitFetch,
    gitPull,
    gitPush,
    gitCommit,
    gitCheckout,
    gitCreateBranch,
    gitUndoCommit,
    gitResolveConflict,
    listBranches,
    getFileDiff,
    getGitHistory,
    createGithubRepository,
    addRepositoryToWorkspace,
    deleteWorkspace
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
    commandPaletteOpen: boolean;
    navigationContext: NavigationContext;
    isLoading: boolean;
    isFetching: boolean;
    isPulling: boolean;
    isPushing: boolean;
    branches: Branch[];
    commits: CommitInfo[];
    error: string | null;

    // Actions
    setSelectedWorkspace: (id: string | null) => void;
    createWorkspace: (name: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    setSelectedRepository: (path: string | null) => void;
    setSelectedFile: (path: string | null) => Promise<void>;
    addRepositoryToWorkspace: (workspaceId: string, repoPath: string) => Promise<void>;

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

    // GitHub Integration
    createGithubRepository: (token: string, name: string, description: string | undefined, isPrivate: boolean) => Promise<void>;

    toggleCommandPalette: () => void;
    setNavigationContext: (context: NavigationContext) => void;
    loadWorkspaces: () => Promise<void>;
    scanForRepositories: (path: string) => Promise<void>;
    refreshRepositoryStatus: () => Promise<void>;
    pollRepositoryStatus: () => Promise<void>;
    clearError: () => void;
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
    commandPaletteOpen: false,
    navigationContext: "sidebar",
    isLoading: false,
    isFetching: false,
    isPulling: false,
    isPushing: false,
    branches: [],
    commits: [],
    error: null,

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
            const diff = await getFileDiff(selectedRepositoryPath, filePath);
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
            set({ error: `Push failed: ${error}`, isPushing: false, isLoading: false });
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

    createGithubRepository: async (token, name, description, isPrivate) => {
        set({ isLoading: true });
        try {
            await createGithubRepository(token, name, description, isPrivate);
            set({ isLoading: false });
        } catch (error) {
            set({ error: `Failed to create GitHub repository: ${error}`, isLoading: false });
            throw error; // Re-throw to let component handle success/failure UI
        }
    },

    addRepositoryToWorkspace: async (workspaceId, repoPath) => {
        try {
            await addRepositoryToWorkspace(workspaceId, repoPath);
            await get().loadWorkspaces();
        } catch (error) {
            set({ error: `Failed to add repository to workspace: ${error}` });
        }
    },

    toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

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
}));
