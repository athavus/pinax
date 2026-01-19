import { useAppStore } from "@/stores/appStore";

export function useWorkspaceRepositories() {
    const { repositories, selectedWorkspaceId, workspaces } = useAppStore();

    if (!selectedWorkspaceId) return repositories;

    const workspace = workspaces.find((w) => w.id === selectedWorkspaceId);
    if (!workspace) return repositories;

    return repositories.filter((repo) => workspace.repositories.includes(repo.path));
}
