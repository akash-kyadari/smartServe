"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

export default function CustomerNavbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="h-14 bg-background"></div>;

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 px-4 h-14 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                    <UtensilsCrossed size={18} />
                </div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                    SmartRestro
                </span>
            </div>

            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-secondary transition-colors text-foreground"
                aria-label="Toggle Theme"
            >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </nav>
    );
}
