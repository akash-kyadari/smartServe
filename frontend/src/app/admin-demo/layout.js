"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, UtensilsCrossed, Users, Settings, LogOut, Menu, X, Sun, Moon, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
        >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Mock checking login status or just simple UI
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return <div className="min-h-screen bg-background" />;

    const NAV_ITEMS = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Menu Management", href: "/admin/menu", icon: UtensilsCrossed },
        { name: "Staff & Shifts", href: "/admin/staff", icon: Users },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-secondary/30 font-sans text-foreground overflow-hidden">

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg">S</Link>
                    <span className="font-bold text-foreground">Smart Serve</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-foreground hover:bg-secondary rounded-lg">
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-64 bg-background border-r border-border flex-col fixed inset-y-0 z-20">
                <div className="p-6 border-b border-border h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <span className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg">S</span>
                        Smart Serve
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-foreground text-background shadow-md"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground"} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border space-y-2">
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Theme</span>
                        <ThemeToggle />
                    </div>
                    <Link href="/business" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <LogOut size={18} />
                        Exit Demo
                    </Link>
                </div>
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="md:hidden fixed inset-y-0 left-0 w-64 bg-background z-50 shadow-2xl flex flex-col border-r border-border"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg">S</div>
                                    <span className="font-bold text-foreground">Smart Serve</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground">
                                    <X size={24} />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-1">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={clsx(
                                                "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all group",
                                                isActive
                                                    ? "bg-foreground text-background"
                                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                        >
                                            <item.icon size={20} className={isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground"} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-border bg-secondary/20">
                                <Link href="/" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                                    <LogOut size={18} />
                                    Exit Demo
                                </Link>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 h-full overflow-y-auto pt-16 md:pt-0 bg-secondary/30">
                <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
