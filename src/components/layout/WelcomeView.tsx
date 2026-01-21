/**
 * WelcomeView - Displayed when no repository is selected
 */

import logo from "@/assets/whitelogo.png";

export function WelcomeView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/50 animate-in fade-in duration-700">
      <div className="relative mb-12">
        <div className="absolute -inset-16 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <img
          src={logo}
          alt="pinax logo"
          className="w-64 h-64 relative z-10 drop-shadow-[0_0_50px_rgba(var(--primary),0.3)] object-contain transition-all duration-700"
        />
      </div>

      <h2 className="text-4xl font-bold tracking-tight mb-4 lowercase">
        pinax
      </h2>
      <p className="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto mb-10 text-lg leading-relaxed font-medium">
        a minimal git workbench for repo management. <br />
      </p>

      <div className="mt-12 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">
        Select a repository to start
      </div>
    </div>
  );
}
