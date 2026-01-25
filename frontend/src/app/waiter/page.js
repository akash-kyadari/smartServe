"use client";

import React, { useState, useEffect } from "react";
import { Bell, CreditCard, Banknote, Users, ChevronRight, Check, ArrowLeft, Sun, Moon, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- Mock Data ---
const TABLES = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    status: i === 3 ? "service" : i % 3 === 0 ? "occupied" : "free", // mock statuses
    guests: i % 3 === 0 ? Math.floor(Math.random() * 4) + 1 : 0,
}));

const NOTIFICATIONS = [
    { id: 1, text: "Table 04 requested a waiter", time: "2m ago", type: "alert" },
    { id: 2, text: "Order for Table 12 is Ready", time: "Just now", type: "success" },
    { id: 3, text: "Table 09 payment pending", time: "5m ago", type: "info" },
];

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-foreground"
        >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default function WaiterPage() {
    const [selectedTable, setSelectedTable] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => setIsMounted(true), []);

    const getStatusColor = (status) => {
        switch (status) {
            case "free": return "bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40";
            case "occupied": return "bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40";
            case "service": return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 ring-2 ring-yellow-400 dark:ring-yellow-600 ring-offset-2 dark:ring-offset-slate-950 hover:bg-yellow-200 dark:hover:bg-yellow-900/40";
            default: return "bg-secondary";
        }
    };

    if (!isMounted) return <div className="min-h-screen bg-background" />;

    return (
        <div className="min-h-screen bg-[var(--uibg)] pb-20 flex justify-center text-foreground font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-950 min-h-screen shadow-2xl relative border-x border-border flex flex-col">

                {/* Header */}
                <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground leading-tight">Zone A</h1>
                            <p className="text-xs text-muted-foreground">Alex • Shift Ends 10pm</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <div className="relative p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors cursor-pointer">
                            <Bell size={20} className="text-muted-foreground" />
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
                        </div>
                    </div>
                </header>

                {/* Notifications */}
                <section className="px-4 py-4">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Alerts</h2>
                    <div className="space-y-2">
                        {NOTIFICATIONS.map((n) => (
                            <div key={n.id} className="bg-card text-card-foreground p-3 rounded-lg shadow-sm border border-border flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("h-2 w-2 rounded-full", n.type === 'alert' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500')}></div>
                                    <div>
                                        <p className="text-sm font-medium">{n.text}</p>
                                        <p className="text-xs text-muted-foreground">{n.time}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Table Grid */}
                <section className="px-4 py-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Floor Plan</h2>
                        <div className="p-1.5 bg-secondary rounded text-muted-foreground"><LayoutGrid size={14} /></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {TABLES.map((table) => (
                            <motion.button
                                key={table.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTable(table)}
                                className={clsx(
                                    "aspect-square rounded-full flex flex-col items-center justify-center border-2 transition-all shadow-sm relative",
                                    getStatusColor(table.status)
                                )}
                            >
                                <span className="text-xl font-bold">{table.id}</span>
                                {table.status !== 'free' && <span className="text-[10px] font-medium flex items-center gap-0.5"><Users size={10} /> {table.guests}</span>}
                                {table.status === 'service' && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 text-white items-center justify-center text-[10px]">!</span>
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Billing Modal Sheet */}
                <AnimatePresence>
                    {selectedTable && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedTable(null)}
                                className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 inset-x-0 sm:max-w-md sm:mx-auto bg-white dark:bg-slate-900 rounded-t-3xl z-50 p-6 min-h-[50vh] shadow-xl border-t border-white/10"
                            >
                                <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">Table {selectedTable.id}</h2>
                                        <span className={clsx("px-2 py-0.5 rounded text-xs font-medium uppercase",
                                            selectedTable.status === 'free' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                        )}>
                                            {selectedTable.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total Bill</p>
                                        <p className="text-3xl font-bold text-foreground">₹1,240</p>
                                    </div>
                                </div>

                                {selectedTable.status !== 'free' ? (
                                    <div className="space-y-6">
                                        <div className="bg-secondary p-4 rounded-xl space-y-2 text-sm text-muted-foreground">
                                            <div className="flex justify-between"><span>2x Spicy Wings</span><span>₹640</span></div>
                                            <div className="flex justify-between"><span>1x Truffle Pizza</span><span>₹450</span></div>
                                            <div className="flex justify-between"><span>1x Lime Soda</span><span>₹150</span></div>
                                            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border"><span>Total</span><span>₹1,240</span></div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-foreground mb-3">Payment Method</p>
                                            <div className="flex gap-3">
                                                {['Cash', 'UPI', 'Card'].map(method => (
                                                    <button
                                                        key={method}
                                                        onClick={() => setPaymentMethod(method)}
                                                        className={clsx(
                                                            "flex-1 py-3 rounded-xl border font-medium transition-all flex items-center justify-center gap-2",
                                                            paymentMethod === method
                                                                ? "bg-foreground text-background border-foreground"
                                                                : "bg-background text-muted-foreground border-border hover:bg-secondary"
                                                        )}
                                                    >
                                                        {method === 'Cash' && <Banknote size={16} />}
                                                        {method === 'Card' && <CreditCard size={16} />}
                                                        {method}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                                            <Check size={20} />
                                            Generate Bill
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p>Table is currently empty.</p>
                                        <button className="mt-4 px-6 py-2 bg-foreground text-background rounded-lg text-sm font-medium">
                                            Assign Guests
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
