"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, X, Moon, Sun, User, LogOut, Calendar, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/useAuthStore";
import { usePathname } from "next/navigation";

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Toggle Theme"
        >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated, logout, user } = useAuthStore();
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
                        <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sunset/20">S</div>
                        <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {isAuthenticated && (
                            <>
                                <Link href="/restaurants" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors ${pathname === '/restaurants' ? 'text-primary font-bold' : ''}`}>
                                    <UtensilsCrossed className="inline h-4 w-4 mr-1" />
                                    Restaurants
                                </Link>
                                <Link href="/bookings" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors ${pathname === '/bookings' ? 'text-primary font-bold' : ''}`}>
                                    <Calendar className="inline h-4 w-4 mr-1" />
                                    My Bookings
                                </Link>

                            </>
                        )}

                        <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />
                        <ThemeToggle />

                        <div className="flex items-center gap-4 ml-2">
                            {isAuthenticated ? (
                                <div className="flex items-center gap-4">
                                    <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary transition-colors">
                                        <User size={18} />
                                        <span>{user?.name || 'User'}</span>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        title="Log out"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="text-gray-900 dark:text-white font-semibold text-sm hover:underline">Log in</Link>
                                    <Link href="/signup" className="bg-sunset text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {isAuthenticated && (
                                <>
                                    <Link href="/restaurants" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-900">
                                        <UtensilsCrossed className="inline h-4 w-4 mr-2" />
                                        Restaurants
                                    </Link>
                                    <Link href="/bookings" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-900">
                                        <Calendar className="inline h-4 w-4 mr-2" />
                                        My Bookings
                                    </Link>

                                </>
                            )}

                            <div className="border-t border-gray-100 dark:border-slate-800 my-2 pt-2 space-y-2">
                                {isAuthenticated ? (
                                    <div className="space-y-3 px-3">
                                        <Link href="/profile" className="flex items-center gap-3 text-gray-900 dark:text-white font-medium">
                                            <User size={20} />
                                            {user?.name || 'User'}
                                        </Link>
                                        <button onClick={logout} className="flex items-center gap-3 text-red-600 dark:text-red-400 w-full text-left">
                                            <LogOut size={20} />
                                            Log out
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Link href="/login" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-900">Log in</Link>
                                        <Link href="/signup" className="block w-full text-center px-4 py-3 rounded-lg text-white bg-sunset font-bold shadow-md shadow-sunset/20">
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
