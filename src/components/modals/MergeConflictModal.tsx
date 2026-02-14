/**
 * Modal for resolving merge conflicts
 * Opens automatically when conflicts are detected after pull/push
 */

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { useAppStore } from "@/stores/appStore";
import { AlertTriangle, Check, X, FileText, RefreshCw, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRebaseOrMergeInProgress, continueRebaseOrMerge, abortRebaseOrMerge } from "@/lib/tauri";

interface MergeConflictModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MergeConflictModal({ open, onOpenChange }: MergeConflictModalProps) {
    const {
        selectedRepositoryPath,
        repositoryStatus,
        resolveConflict,
        setSelectedFile,
        openSelectedFileInEditor,
        refreshRepositoryStatus,
        settings,
    } = useAppStore();

    const [isContinuing, setIsContinuing] = useState(false);
    const [isAborting, setIsAborting] = useState(false);
    const [isRebaseInProgress, setIsRebaseInProgress] = useState(false);

    const conflicts = repositoryStatus?.conflicts || [];

    useEffect(() => {
        if (open && selectedRepositoryPath) {
            checkRebaseStatus();
        }
    }, [open, selectedRepositoryPath]);

    const checkRebaseStatus = async () => {
        if (!selectedRepositoryPath) return;
        try {
            const inProgress = await isRebaseOrMergeInProgress(selectedRepositoryPath);
            setIsRebaseInProgress(inProgress);
        } catch (error) {
            console.error("Failed to check rebase status:", error);
        }
    };

    const handleContinue = async () => {
        if (!selectedRepositoryPath) return;

        // Check if all conflicts are resolved
        await refreshRepositoryStatus();
        const currentStatus = await useAppStore.getState().repositoryStatus;

        if (currentStatus && currentStatus.conflicts.length > 0) {
            // Still have conflicts, show error
            useAppStore.getState().error = "Ainda existem conflitos não resolvidos. Por favor, resolva todos os conflitos antes de continuar.";
            return;
        }

        setIsContinuing(true);
        try {
            await continueRebaseOrMerge(selectedRepositoryPath);
            await refreshRepositoryStatus();
            await checkRebaseStatus();

            // Check if there are more conflicts after continuing
            const newStatus = await useAppStore.getState().repositoryStatus;
            if (newStatus && newStatus.conflicts.length === 0 && !(await isRebaseOrMergeInProgress(selectedRepositoryPath))) {
                // All conflicts resolved and rebase/merge complete
                onOpenChange(false);
                useAppStore.getState().successAlert = {
                    title: "Conflitos Resolvidos",
                    message: "Todos os conflitos foram resolvidos e o rebase/merge foi concluído com sucesso."
                };
            } else if (newStatus && newStatus.conflicts.length > 0) {
                // More conflicts appeared, keep modal open
                useAppStore.getState().error = null;
            }
        } catch (error) {
            useAppStore.getState().error = `Falha ao continuar rebase/merge: ${error}`;
        } finally {
            setIsContinuing(false);
        }
    };

    const handleAbort = async () => {
        if (!selectedRepositoryPath) return;
        setIsAborting(true);
        try {
            await abortRebaseOrMerge(selectedRepositoryPath);
            await refreshRepositoryStatus();
            await checkRebaseStatus();
            onOpenChange(false);
            useAppStore.getState().successAlert = {
                title: "Rebase/Merge Abortado",
                message: "O rebase/merge foi abortado com sucesso."
            };
        } catch (error) {
            useAppStore.getState().error = `Falha ao abortar rebase/merge: ${error}`;
        } finally {
            setIsAborting(false);
        }
    };

    const handleResolveConflict = async (filePath: string, resolution: "ours" | "theirs") => {
        await resolveConflict(filePath, resolution);
        await refreshRepositoryStatus();
        await checkRebaseStatus();
    };

    const handleMarkAsResolved = async (filePath: string) => {
        if (!selectedRepositoryPath) return;
        try {
            const { stageFile } = useAppStore.getState();
            await stageFile(filePath);
            await refreshRepositoryStatus();
            await checkRebaseStatus();
        } catch (error) {
            useAppStore.getState().error = `Falha ao marcar arquivo como resolvido: ${error}`;
        }
    };

    const handleOpenInEditor = async (filePath: string) => {
        setSelectedFile(filePath);
        await openSelectedFileInEditor();
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose className="sm:max-w-[600px] max-w-[600px] p-0 overflow-hidden">
                <div className="px-8 py-6">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-destructive/20 text-destructive shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-xl font-black text-foreground min-w-0">
                                Conflitos de Merge Detectados
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-muted-foreground/70">
                            {isRebaseInProgress
                                ? "Um rebase está em andamento. Resolva os conflitos abaixo e clique em 'Continuar' para prosseguir."
                                : "Um merge está em andamento. Resolva os conflitos abaixo e clique em 'Continuar' para prosseguir."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {conflicts.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground/50">
                                <Check className="w-8 h-8 mx-auto mb-2 text-primary opacity-50" />
                                <p className="text-sm">Nenhum conflito encontrado. Você pode continuar.</p>
                            </div>
                        ) : (
                            conflicts.map((conflict) => (
                                <div
                                    key={conflict.path}
                                    className="p-4 bg-background/40 border border-border/20 rounded-xl hover:border-destructive/40 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-3 min-w-0">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-destructive shrink-0" />
                                            <span className="text-sm font-mono text-foreground truncate min-w-0">
                                                {conflict.path}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleOpenInEditor(conflict.path)}
                                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-muted hover:bg-muted/80 text-foreground border border-border/40 rounded-lg transition-all flex items-center gap-2"
                                                title={`Open in ${settings.preferredEditor === 'auto' ? 'Default Editor' : settings.preferredEditor}`}
                                            >
                                                <Code2 className="w-3 h-3 opacity-60" />
                                                Open in {settings.preferredEditor === 'auto' ? 'Editor' : settings.preferredEditor}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleResolveConflict(conflict.path, "ours")}
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-background border border-border/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg transition-all"
                                        >
                                            Usar Nossa Versão
                                        </button>
                                        <button
                                            onClick={() => handleResolveConflict(conflict.path, "theirs")}
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-background border border-border/20 hover:bg-primary/10 hover:border-primary/40 rounded-lg transition-all"
                                        >
                                            Usar Versão Remota
                                        </button>
                                        <button
                                            onClick={() => handleMarkAsResolved(conflict.path)}
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary/20 border border-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all"
                                        >
                                            Marcar como Resolvido
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="px-8 py-4 border-t border-border/10 bg-muted/20 flex items-center justify-between">
                    <button
                        onClick={handleAbort}
                        disabled={isAborting || isContinuing}
                        className={cn(
                            "px-4 py-2 text-sm font-black uppercase tracking-widest border border-destructive/20 hover:bg-destructive/10 text-destructive rounded-lg transition-all flex items-center gap-2",
                            (isAborting || isContinuing) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isAborting ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Abortando...
                            </>
                        ) : (
                            <>
                                <X className="w-4 h-4" />
                                Abortar
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={isContinuing || isAborting}
                        className={cn(
                            "px-6 py-2 text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground hover:brightness-110 rounded-lg transition-all flex items-center gap-2",
                            (isContinuing || isAborting) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isContinuing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Continuando...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Continuar
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

