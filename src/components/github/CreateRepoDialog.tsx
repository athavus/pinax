import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/appStore";
import { Github, Loader2 } from "lucide-react";

export function CreateRepoDialog() {
    const { createGithubRepository, isLoading } = useAppStore();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"token" | "details">("token");
    const [token, setToken] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name) return;
        setError(null);
        try {
            await createGithubRepository(token, name, description || undefined, isPrivate);
            setOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const resetForm = () => {
        setStep("token");
        setToken("");
        setName("");
        setDescription("");
        setIsPrivate(false);
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                <button className="p-1 hover:bg-[hsl(var(--accent))] rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" title="Create Repository on GitHub">
                    <Github className="w-4 h-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create GitHub Repository</DialogTitle>
                    <DialogDescription>
                        {step === "token"
                            ? "Enter your GitHub Personal Access Token (PAT) with 'repo' scope."
                            : "Configure your new repository details."}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    {step === "token" ? (
                        <div className="grid gap-2">
                            <label htmlFor="token" className="text-sm font-medium">Personal Access Token</label>
                            <input
                                id="token"
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                                placeholder="ghp_..."
                            />
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                We don't store your token. It's used once for this request.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-2">
                                <label htmlFor="name" className="text-sm font-medium">Repository Name</label>
                                <input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                                    placeholder="my-awesome-project"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
                                <input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                                    placeholder="A brief description..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="private"
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="h-4 w-4 rounded border-[hsl(var(--primary))] text-[hsl(var(--primary))] ring-offset-[hsl(var(--background))] focus:ring-[hsl(var(--ring))]"
                                />
                                <label htmlFor="private" className="text-sm font-medium">Private Repository</label>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    {step === "token" ? (
                        <button
                            onClick={() => setStep("details")}
                            disabled={!token}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow hover:bg-[hsl(var(--primary))/90] h-9 px-4 py-2 disabled:opacity-50"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={isLoading || !name}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow hover:bg-[hsl(var(--primary))/90] h-9 px-4 py-2 disabled:opacity-50 gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Repository
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
