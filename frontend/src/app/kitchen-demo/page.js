"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Flame, User, Users, AlertCircle, ArrowLeft, Sun, Moon, Filter, Loader2 } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- Mock Data ---
const INITIAL_ORDERS = [
    {
        _id: "K001",
        tableNo: "09",
        createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
        status: "PLACED",
        items: [
            { name: "Truffle Mushroom Pizza", quantity: 1 },
            { name: "Coke Zero", quantity: 2 },
        ],
        waiterId: { name: "Alex" }
    },
    {
        _id: "K002",
        tableNo: "04",
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: "PREPARING",
        items: [
            { name: "Spicy Chicken Wings", quantity: 2 },
        ],
        waiterId: { name: "Sam" }
    },
    {
        _id: "K003",
        tableNo: "12",
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        status: "PLACED",
        items: [
            { name: "Paneer Tikka Bowl", quantity: 1 },
            { name: "Garlic Bread", quantity: 1 },
            { name: "Lime Soda", quantity: 1 },
        ],
        waiterId: { name: "Alex" }
    },
    {
        _id: "K004",
        tableNo: "07",
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        status: "READY",
        items: [
            { name: "Burrata Salad", quantity: 1 },
        ],
        waiterId: { name: "Sam" }
    },
];

const STAFF_MOCK = [
    { _id: 1, name: "Alex", role: "waiter", isActive: true },
    { _id: 2, name: "Sam", role: "waiter", isActive: true },
    { _id: 3, name: "Mike", role: "waiter", isActive: false },
];

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-slate-400 hover:text-foreground"
        >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default function KitchenPage() {
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [now, setNow] = useState(Date.now());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        document.title = "Kitchen Display Demo | Smart Serve";
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = (id, newStatus) => {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    };

    const getElapsed = (createdAt) => {
        const minutes = Math.floor((now - new Date(createdAt).getTime()) / 60000);
        return minutes + 'm';
    };

    const newOrders = orders.filter(o => o.status === 'PLACED');
    const cookingOrders = orders.filter(o => o.status === 'PREPARING');
    const readyOrders = orders.filter(o => o.status === 'READY');
    const activeStaff = STAFF_MOCK.filter(s => s.isActive);
    const offlineStaff = STAFF_MOCK.filter(s => !s.isActive);

    if (!isMounted) return <div className="min-h-screen bg-background" />;

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
            {/* Sidebar - Staff Status */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
                <div className="p-6 border-b border-border pl-4">
                    <Link href="/business" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <h2 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        <Users className="text-primary" size={20} />
                        Staff Status
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online Waiters ({activeStaff.length})
                        </h3>
                        {activeStaff.length > 0 ? (
                            <div className="space-y-2">
                                {activeStaff.map(s => (
                                    <div key={s._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 flex items-center justify-center font-bold text-xs">
                                            {s.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No active waiters</p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            Offline ({offlineStaff.length})
                        </h3>
                        <div className="space-y-2 opacity-60">
                            {offlineStaff.map(s => (
                                <div key={s._id} className="flex items-center gap-3 p-2 rounded-lg">
                                    <div className="h-8 w-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-bold text-xs">
                                        {s.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-secondary/5">
                {/* Top Bar */}
                <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                            <Flame className="text-orange-500" size={28} />
                            Kitchen Display
                        </h1>
                        <p className="text-sm text-muted-foreground">Demo Restaurant</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-orange-200 dark:border-orange-800">
                            <Clock size={16} />
                            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-green-200 dark:border-green-800 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Live
                        </div>
                    </div>
                </header>

                {/* Kanban Board */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto md:overflow-x-auto md:overflow-y-hidden p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-6 h-full min-w-0 md:min-w-max">
                        {/* New Orders Column */}
                        <div className="w-full md:w-96 flex flex-col gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50 shrink-0 h-auto md:h-full">
                            <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                                <span className="flex items-center gap-2"><AlertCircle size={16} className="text-blue-500" /> New Orders</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{newOrders.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide min-h-[200px] md:min-h-0">
                                <AnimatePresence>
                                    {newOrders.map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-card text-card-foreground p-5 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow relative overflow-hidden group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">Table {order.tableNo}</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">#{order._id.slice(-4)}</span>
                                                </div>
                                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">{getElapsed(order.createdAt)}</span>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-start text-sm">
                                                        <span className="font-semibold text-foreground">{item.quantity}x</span>
                                                        <span className="flex-1 ml-3 text-muted-foreground font-medium">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-3 border-t border-border mt-2 flex justify-between items-center">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <User size={12} />
                                                    {order.waiterId?.name || "Unassigned"}
                                                </div>
                                                <button
                                                    onClick={() => updateStatus(order._id, "PREPARING")}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
                                                >
                                                    <Flame size={14} /> Start
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {newOrders.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                                        <CheckCircle size={32} className="mb-2" />
                                        <p className="text-sm">All caught up!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cooking Column */}
                        <div className="w-full md:w-96 flex flex-col gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50 shrink-0 h-auto md:h-full">
                            <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                                <span className="flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Cooking</span>
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{cookingOrders.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide min-h-[200px] md:min-h-0">
                                <AnimatePresence>
                                    {cookingOrders.map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className="bg-card text-card-foreground p-5 rounded-xl shadow-md border-l-4 border-orange-500 relative group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">Table {order.tableNo}</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">#{order._id.slice(-4)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-orange-600 text-xs font-bold animate-pulse">
                                                    <Loader2 size={12} className="animate-spin" /> Cooking
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-start text-sm">
                                                        <span className="font-semibold text-foreground">{item.quantity}x</span>
                                                        <span className="flex-1 ml-3 text-foreground font-medium">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-3 border-t border-border mt-2 flex justify-end">
                                                <button
                                                    onClick={() => updateStatus(order._id, "READY")}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 shadow-sm w-full justify-center"
                                                >
                                                    <CheckCircle size={14} /> Mark Ready
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {cookingOrders.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                                        <Flame size={32} className="mb-2" />
                                        <p className="text-sm">No orders nearby</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ready Column */}
                        <div className="w-full md:w-96 flex flex-col gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50 shrink-0 h-auto md:h-full">
                            <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Ready to Serve</span>
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{readyOrders.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide min-h-[200px] md:min-h-0">
                                <AnimatePresence>
                                    {readyOrders.map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-card text-card-foreground p-5 rounded-xl shadow-sm border-l-4 border-green-500 opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg">Table {order.tableNo}</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">#{order._id.slice(-4)}</span>
                                                </div>
                                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Done</span>
                                            </div>

                                            <div className="space-y-1 mb-2">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="text-sm text-muted-foreground line-through">
                                                        {item.quantity}x {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-2 italic text-center">
                                                Waiting for waiter pickup...
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {readyOrders.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                                        <Clock size={32} className="mb-2" />
                                        <p className="text-sm">No pending pickups</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
