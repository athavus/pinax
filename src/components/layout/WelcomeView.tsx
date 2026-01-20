/**
 * WelcomeView - Displayed when no repository is selected
 */

import { History, Layout } from "lucide-react";
import logo from "@/assets/whitelogo.png";

export function WelcomeView() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50 animate-in fade-in duration-700">
            <div className="relative mb-12">
                <div className="absolute -inset-16 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                <img src={logo} alt="pinax logo" className="w-64 h-64 relative z-10 drop-shadow-[0_0_50px_rgba(var(--primary),0.3)] object-contain transition-all duration-700" />
            </div>

            <h2 className="text-4xl font-bold tracking-tight mb-4 lowercase">pinax git-workbench</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto mb-10 text-lg leading-relaxed font-medium">
                A premium and minimal Git workbench for professional workflows. <br />
                Explore your history and manage your workspaces with absolute precision.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                <div className="flex items-start gap-6 p-8 rounded-2xl bg-card border border-border/10 hover:border-primary/30 transition-all group hover:bg-primary/5 shadow-sm">
                    <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <History className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold mb-2">Deep Inspection</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Click on any commit to explore changed files in detail, just like your favorite professional tools.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-6 p-8 rounded-2xl bg-card border border-border/10 hover:border-primary/30 transition-all group hover:bg-primary/5 shadow-sm">
                    <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Layout className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold mb-2">Workspace Control</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Organize your repositories into workspaces and hide what you don't need for a clean, focused experience.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">
                Select a repository to start
            </div>
        </div>
    );
}
