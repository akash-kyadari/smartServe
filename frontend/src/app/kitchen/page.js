"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertTriangle, ArrowLeft, Sun, Moon, Filter } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- Mock Data ---
const INITIAL_ORDERS = [
    {
        id: "K001",
        tableId: "09",
        startTime: new Date(Date.now() - 1000 * 60 * 16), // 16 mins ago (Red Alert)
        status: "pending",
        items: [
            { name: "Truffle Mushroom Pizza", qty: 1 },
            { name: "Coke Zero", qty: 2 },
        ],
    },
    {
        id: "K002",
        tableId: "04",
        startTime: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
        status: "pending",
        items: [
            { name: "Spicy Chicken Wings", qty: 2 },
        ],
    },
    {
        id: "K003",
        tableId: "12",
        startTime: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
        status: "pending",
        items: [
            { name: "Paneer Tikka Bowl", qty: 1 },
            { name: "Garlic Bread", qty: 1 },
            { name: "Lime Soda", qty: 1 },
        ],
    },
    {
        id: "K004",
        tableId: "07",
        startTime: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
        status: "pending",
        items: [
            { name: "Burrata Salad", qty: 1 },
        ],
    },
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

const Ticket = ({ order, onMarkReady }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - order.startTime.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [order.startTime]);

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const isLate = mins >= 15;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={clsx(
                "rounded-xl border p-4 flex flex-col justify-between h-auto min-h-[300px] shadow-sm relative overflow-hidden transition-colors",
                isLate
                    ? "border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-950/20 shadow-red-100 dark:shadow-red-900/10"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-gray-200/50 dark:shadow-none"
            )}
        >
            {isLate && <div className="absolute top-0 right-0 p-20 bg-red-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />}

            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-white/10 pb-2 relative z-10 transition-colors">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Table {order.tableId}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">#{order.id}</p>
                </div>
                <div className={clsx(
                    "flex items-center gap-1 px-2 py-1 rounded font-mono text-sm font-bold",
                    isLate ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse" : "bg-gray-100 dark:bg-slate-700 text-green-600 dark:text-green-400"
                )}>
                    <Clock size={14} />
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 space-y-3 mb-4 relative z-10">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-700 dark:text-slate-200">
                        <span className="font-semibold text-lg">{item.qty} <span className="text-gray-400 dark:text-slate-500 text-sm">x</span> {item.name}</span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <button
                onClick={() => onMarkReady(order.id)}
                className={clsx(
                    "w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 relative z-10",
                    "bg-gray-100 hover:bg-green-600 text-gray-900 hover:text-white dark:bg-slate-700 dark:hover:bg-green-600 dark:text-white hover:shadow-lg hover:shadow-green-500/30"
                )}
            >
                <CheckCircle size={20} />
                Ready
            </button>
        </motion.div>
    );
};

export default function KitchenPage() {
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => setIsMounted(true), []);

    const markReady = (id) => {
        setOrders((prev) => prev.filter(o => o.id !== id));
    };

    if (!isMounted) return <div className="min-h-screen bg-background" />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-foreground p-4 sm:p-6 font-sans transition-colors duration-300">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-white dark:bg-slate-900 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white shadow-sm border border-gray-200 dark:border-slate-800">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                            <AlertTriangle className="text-orange-500" />
                            Kitchen Display
                        </h1>
                        <p className="text-gray-500 dark:text-slate-500 mt-1 text-sm">Live Orders: {orders.length} | Avg Time: 4:12</p>
                    </div>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg text-sm text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800 shadow-sm">
                        <Filter size={16} />
                        <span>All Stations</span>
                    </div>
                    <ThemeToggle />
                    <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 flex justify-between sm:block items-center min-w-[140px] shadow-sm">
                        <p className="text-xs text-gray-500 dark:text-slate-400 sm:text-right">Head Chef</p>
                        <p className="font-bold text-gray-900 dark:text-white sm:text-right">Ramsey G.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                <AnimatePresence>
                    {orders.map((order) => (
                        <Ticket key={order.id} order={order} onMarkReady={markReady} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
