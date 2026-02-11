"use client";

import React, { useState } from "react"; // Added useState
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, UtensilsCrossed, Users, Settings, User, Menu, X, Monitor, Calendar } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

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

export default function BusinessNavbar({ currentRestaurant }) {
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state

    const isOwner = user?.roles?.includes('owner') || user?.role?.includes('owner');

    const handleLogout = async () => {
        await logout();
        router.push('/business');
    };

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo / Context Title */}
                    <div className="flex items-center gap-4">
                        <Link href="/business" className="flex items-center gap-2 group">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-xl group-hover:bg-orange-600 transition-colors">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight block">Smart Serve</span>
                        </Link>

                        {/* Separator & Breadcrumb for Restaurant Context */}
                        {currentRestaurant && (
                            <>
                                <span className="text-gray-300 dark:text-gray-700 mx-2 text-xl">/</span>
                                <Link href={`/business/owner/restros/${currentRestaurant._id}`} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
                                    <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                                        {currentRestaurant.name}
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-4">


                        {currentRestaurant && isOwner ? (
                            <nav className="flex items-center gap-1 text-sm font-medium text-muted-foreground mr-4">
                                <NavLink href={`/business/owner/restros/${currentRestaurant._id}`} icon={LayoutDashboard} label="Dashboard" active={pathname === `/business/owner/restros/${currentRestaurant._id}`} />
                                <NavLink href={`/business/owner/restros/${currentRestaurant._id}/bookings`} icon={Calendar} label="Bookings" active={pathname.includes('/bookings')} />
                                <NavLink href={`/business/owner/restros/${currentRestaurant._id}/menu`} icon={UtensilsCrossed} label="Menu" active={pathname.includes('/menu')} />
                                <NavLink href={`/business/owner/restros/${currentRestaurant._id}/staff`} icon={Users} label="Staff" active={pathname.includes('/staff')} />
                                <NavLink href={`/business/owner/restros/${currentRestaurant._id}/settings`} icon={Settings} label="Settings" active={pathname.includes('/settings')} />
                            </nav>
                        ) : null}

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-800">
                            <ThemeToggle />
                            {user ? (
                                <>
                                    <Link href="/business/profile" className="flex flex-col items-end hover:bg-gray-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors group">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white leading-none group-hover:text-sunset transition-colors">{user?.name}</span>
                                        <span className="text-xs text-gray-500 capitalize">{isOwner ? 'Owner' : (user?.roles?.[0] || user?.role?.[0])}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/restro-login" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-foreground">Login</Link>
                                    <Link href="/restro-signup" className="px-3 py-2 text-sm font-bold text-white bg-sunset rounded-lg hover:opacity-90 transition-opacity">Register</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Actions - Context Aware */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <ThemeToggle />
                        {!currentRestaurant || !isOwner ? (
                            // Inline actions for root business page (no side drawer needed)
                            user ? (
                                <div className="flex items-center gap-3">
                                    <Link href="/business/profile" className="flex flex-col items-end hover:bg-gray-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors group">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white leading-none group-hover:text-sunset transition-colors">{user?.name}</span>
                                        <span className="text-xs text-gray-500 capitalize">{isOwner ? 'Owner' : (user?.roles?.[0] || user?.role?.[0])}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/restro-login" className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-foreground">Login</Link>
                                    <Link href="/restro-signup" className="px-2 py-1.5 text-xs font-bold text-white bg-sunset rounded-lg hover:opacity-90 transition-opacity">Register</Link>
                                </div>
                            )
                        ) : (
                            // Hamburger for restaurant context (many links)
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden"
                        />

                        {/* Sidebar Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white dark:bg-slate-950 z-50 shadow-2xl border-r border-border lg:hidden overflow-y-auto flex flex-col"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-border">
                                <span className="font-bold text-lg text-foreground">Menu</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-gray-500 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 p-4 space-y-6">
                                {/* User Info Mobile */}
                                {user ? (
                                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                        <Link href="/business/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 hover:bg-white/50 dark:hover:bg-black/20 p-2 -ml-2 rounded-lg transition-colors">
                                            <div className="h-10 w-10 bg-sunset/10 text-sunset rounded-full flex items-center justify-center">
                                                <User size={20} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{user?.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{isOwner ? 'Owner' : (user?.roles?.[0] || user?.role?.[0])}</p>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 text-gray-500 hover:text-red-500 rounded-lg bg-white dark:bg-slate-900 shadow-sm"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Link href="/restro-login" className="w-full py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-secondary rounded-lg">Login</Link>
                                        <Link href="/restro-signup" className="w-full py-3 text-center text-sm font-bold text-white bg-sunset rounded-lg">Register Restaurant</Link>
                                    </div>
                                )}

                                {/* Navigation Links Mobile */}
                                <nav className="space-y-1">

                                    {currentRestaurant && isOwner ? (
                                        <>
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Manage {currentRestaurant.name}</div>
                                            <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href={`/business/owner/restros/${currentRestaurant._id}`} icon={LayoutDashboard} label="Dashboard" active={pathname === `/business/owner/restros/${currentRestaurant._id}`} />
                                            <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href={`/business/owner/restros/${currentRestaurant._id}/bookings`} icon={Calendar} label="Bookings" active={pathname.includes('/bookings')} />
                                            <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href={`/business/owner/restros/${currentRestaurant._id}/menu`} icon={UtensilsCrossed} label="Menu Management" active={pathname.includes('/menu')} />
                                            <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href={`/business/owner/restros/${currentRestaurant._id}/staff`} icon={Users} label="Staff & Shifts" active={pathname.includes('/staff')} />
                                            <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href={`/business/owner/restros/${currentRestaurant._id}/settings`} icon={Settings} label="Settings" active={pathname.includes('/settings')} />
                                            <div className="pt-4 mt-4 border-t border-border">
                                                <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href="/business/owner" icon={Monitor} label="Switch Restaurant" />
                                            </div>
                                        </>
                                    ) : (
                                        <MobileNavLink onClick={() => setIsMobileMenuOpen(false)} href="/business/owner" icon={LayoutDashboard} label="My Restaurants" active={pathname === "/business/owner"} />
                                    )}
                                </nav>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}

function NavLink({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all ${active ? 'bg-secondary text-foreground font-semibold' : 'hover:bg-secondary/50 hover:text-foreground'}`}
        >
            <Icon size={16} />
            <span>{label}</span>
        </Link>
    );
}

function MobileNavLink({ href, icon: Icon, label, active, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-secondary text-foreground font-semibold' : 'hover:bg-secondary/50 hover:text-foreground'}`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
}
