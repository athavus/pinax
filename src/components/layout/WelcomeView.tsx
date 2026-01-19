/**
 * WelcomeView - Displayed when no repository is selected
 */

import { GitBranch, Command, MousePointer2, PlusCircle } from "lucide-react";

export function WelcomeView() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50 animate-in fade-in duration-700">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                <GitBranch className="w-20 h-20 text-primary relative z-10 opacity-80" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-3">Welcome to Pinax</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-10 text-lg leading-relaxed">
                Your keyboard-first Git workbench. Select a repository from the sidebar to start managing your workflow.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                <div className="flex items-start gap-6 p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group">
                    <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Command className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold mb-2">Command Palette</h3>
                        <p className="text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">⌘</kbd> <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">P</kbd> to quickly find repositories or run commands.</p>
                    </div>
                </div>

                <div className="flex items-start gap-6 p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group">
                    <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <MousePointer2 className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold mb-2">Vim Navigation</h3>
                        <p className="text-muted-foreground">Use <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">j</kbd> and <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-xs">k</kbd> to move through the sidebar lists.</p>
                    </div>
                </div>

                <div className="flex items-start gap-6 p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors group md:col-span-2">
                    <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <PlusCircle className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                        <p className="text-muted-foreground text-pretty">Add your local repositories to a workspace to see status, stage changes, and commit directly from Pinax.</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-xs text-muted-foreground/60 font-mono italic">
                Press Esc to clear focus or close palettes
            </div>
        </div>
    );
}
