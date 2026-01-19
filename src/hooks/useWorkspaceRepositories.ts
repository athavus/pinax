import { useAppStore } from "@/stores/appStore";

export function useWorkspaceRepositories() {
    const { repositories, selectedWorkspaceId, workspaces } = useAppStore();

    if (!selectedWorkspaceId || selectedWorkspaceId === "all") return repositories;

    if (selectedWorkspaceId === "uncategorized") {
        // Find repos that are NOT in any workspace
        return repositories.filter((repo) => {
            return !workspaces.some((ws) => ws.repositories.includes(repo.path));
        });
    }

    const workspace = workspaces.find((w) => w.id === selectedWorkspaceId);
    if (!workspace) return repositories;

    return repositories.filter((repo) => workspace.repositories.includes(repo.path));
}
