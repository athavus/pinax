/**
 * Main application layout with sidebar and central content area
 */

import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { Sidebar } from "./Sidebar";
import { MainArea } from "./MainArea";
import { useAutoRefresh } from "@/hooks";

interface MainLayoutProps {
    className?: string;
}

export function MainLayout({ className }: MainLayoutProps) {
    const { loadWorkspaces } = useAppStore();

    // Load workspaces on mount
    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    // Poll every 500ms as requested
    useAutoRefresh(500);

    return (
        <div
            className={cn(
                "flex h-screen w-screen overflow-hidden p-6 gap-6",
                "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
                className
            )}
        >
            <Sidebar />
            <MainArea />
        </div>
    );
}
