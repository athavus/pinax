import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";

/**
 * Hook to automatically poll repository status
 * @param intervalMs Polling interval in milliseconds
 */
export function useAutoRefresh(intervalMs: number = 2000) {
    const { pollRepositoryStatus, selectedRepositoryPath } = useAppStore();

    useEffect(() => {
        if (!selectedRepositoryPath) return;

        // Initial poll
        pollRepositoryStatus();

        const intervalId = setInterval(() => {
            pollRepositoryStatus();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [selectedRepositoryPath, pollRepositoryStatus, intervalMs]);
}
