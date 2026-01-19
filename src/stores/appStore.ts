/**
 * Global application state using Zustand
 * Keeps track of current selections and UI state
 */

import { create } from "zustand";
import type { Repository, RepositoryStatus, Workspace, NavigationContext, Branch } from "@/types";
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
    listBranches,
    getFileDiff,
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
    branches: Branch[];
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
    branches: [],
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
                // Filter only local branches for the UI as requested
                const branches = allBranches.filter(b => !b.is_remote && b.name !== "HEAD");
                set({ repositoryStatus: status, branches, isLoading: false });
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
        set({ isLoading: true });
        try {
            await gitFetch(selectedRepositoryPath);
            // Refresh status after fetch
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
        } catch (error) {
            set({ error: `Fetch failed: ${error}`, isLoading: false });
        }
    },

    pull: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitPull(selectedRepositoryPath);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
        } catch (error) {
            set({ error: `Pull failed: ${error}`, isLoading: false });
        }
    },

    push: async () => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitPush(selectedRepositoryPath);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
        } catch (error) {
            set({ error: `Push failed: ${error}`, isLoading: false });
        }
    },

    commit: async (message) => {
        const { selectedRepositoryPath } = get();
        if (!selectedRepositoryPath) return;
        set({ isLoading: true });
        try {
            await gitCommit(selectedRepositoryPath, message);
            const status = await getRepositoryStatus(selectedRepositoryPath);
            set({ repositoryStatus: status, isLoading: false });
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
            const branches = allBranches.filter(b => !b.is_remote && b.name !== "HEAD");
            set({ branches });
        } catch (error) {
            console.error("Failed to load branches:", error);
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

    clearError: () => set({ error: null }),
}));
