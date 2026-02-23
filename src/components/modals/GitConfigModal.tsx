import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GitConfigModal() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkGitConfig();
    }, []);

    const checkGitConfig = async () => {
        try {
            const existingName = await invoke<string>("get_global_git_config", { key: "user.name" }).catch(() => "");
            const existingEmail = await invoke<string>("get_global_git_config", { key: "user.email" }).catch(() => "");

            if (!existingName || !existingEmail) {
                setOpen(true);
            }
        } catch (err) {
            console.error("Failed to check git config:", err);
            // Fail safe, ask for it if we can't determine
            setOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            setError("Name and Email are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await invoke("set_global_git_config", {
                name: name.trim(),
                email: email.trim(),
            });
            setOpen(false);
        } catch (err) {
            console.error("Failed to set git config:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Git Global Configuration</DialogTitle>
                    <DialogDescription>
                        Author identity is required to make commits. Please set your global Git username and email.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Full Name
                        </label>
                        <Input
                            id="name"
                            placeholder="e.g. Linus Torvalds"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="e.g. linus@kernel.org"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && <div className="text-sm text-destructive">{error}</div>}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading || !name.trim() || !email.trim()}>
                            {loading ? "Saving..." : "Save Configuration"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
