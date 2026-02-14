import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: "dark",
            toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: "pinax-theme",
        }
    )
);

export function useTheme() {
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    const isDark = theme === "dark";

    return { theme, toggleTheme, isDark } as const;
}
