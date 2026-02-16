"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Bell, DollarSign, CheckCircle, ChefHat, User, LayoutGrid, Check, ArrowLeft, Banknote, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- Mock Data ---
const CURRENT_WAITER_ID = 101;
const USER_NAME = "Alex";

const TABLES = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    number: `T${String(i + 1).padStart(2, '0')}`,
    status: i === 3 ? "occupied" : i % 3 === 0 ? "occupied" : "free", // mock statuses
    capacity: 4,
    guests: i % 3 === 0 ? Math.floor(Math.random() * 4) + 1 : 0,
    assignedWaiterId: i % 3 === 0 ? 101 : (i === 3 ? 102 : null),
    requestService: i === 3,
    requestBill: i === 6,
    isReady: i === 9 // Mocking a ready order
}));

const MOCK_ORDERS = [
    { _id: 'o1', tableId: 10, status: 'READY', items: [{ name: 'Spicy Wings' }, { name: 'Coke' }] }
];

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sunset focus:ring-offset-2 ml-2 ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}
        >
            <span
                className={`${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </button>
    );
};

export default function WaiterPage() {
    const [selectedTable, setSelectedTable] = useState(null);
    const [filter, setFilter] = useState("all");
    const [isOnline, setIsOnline] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("UPI");

    useEffect(() => setIsMounted(true), []);

    const filteredTables = filter === 'mine'
        ? TABLES.filter(t => t.assignedWaiterId === CURRENT_WAITER_ID)
        : TABLES;

    const serviceRequests = TABLES.filter(t => t.requestService);
    const billRequests = TABLES.filter(t => t.requestBill);

    if (!isMounted) return <div className="min-h-screen bg-background" />;

    return (
        <div className="flex flex-col h-screen bg-secondary/10 overflow-hidden relative font-sans text-foreground">
            {/* Header */}
            <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center shadow-sm z-10 gap-3 md:gap-0">
                <div className="flex justify-between items-center w-full md:w-auto">
                    <div>
                        <Link href="/business" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs font-medium mb-1">
                            <ArrowLeft size={14} /> Back
                        </Link>
                        <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                            <ClipboardList className="text-sunset" size={20} />
                            POS Terminal
                        </h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 mt-0.5 md:mt-1">
                            Waiter Panel <span className="w-1 h-1 rounded-full bg-muted-foreground"></span> {USER_NAME}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        <span className="text-xs font-medium text-foreground">{isOnline ? 'Online' : 'Offline'}</span>
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sunset focus:ring-offset-2 ml-1 ${isOnline ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`${isOnline ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1 md:pb-0">
                    <div className="hidden md:flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        <span className="text-xs font-medium text-foreground">{isOnline ? 'On' : 'Off'}</span>
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sunset focus:ring-offset-2 ml-2 ${isOnline ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className={`${isOnline ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                        {/* Mock Status Pills */}
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold bg-blue-500/10 text-blue-600 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-blue-200 animate-pulse whitespace-nowrap">
                            <DollarSign size={12} className="fill-blue-600" />
                            1 Bill
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-yellow-200 animate-pulse whitespace-nowrap">
                            <Bell size={12} className="fill-yellow-600" />
                            1 Req
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium bg-green-500/10 text-green-600 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-green-200 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Live
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {!isOnline ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/95 backdrop-blur-sm z-20">
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
                        <div className="w-16 h-16 rounded-full border-4 border-gray-300 border-t-gray-500 animate-spin flex items-center justify-center">
                            <span className="text-2xl animate-none">💤</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">You are Offline</h2>
                    <p className="text-muted-foreground mb-8 max-w-sm">
                        You're not visible to the kitchen or customers. Go online to start receiving orders and requests.
                    </p>
                    <button
                        onClick={() => setIsOnline(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-green-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        Go Online ⚡
                    </button>
                </div>
            ) : (
                <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Priority Actions Section */}
                        <div className="bg-background/50 border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Priority Tasks
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {/* Bill Requests */}
                                {billRequests.map(table => (
                                    <motion.div
                                        key={`bill-${table.id}`}
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 p-4 rounded-xl shadow-sm flex items-center gap-4 min-w-[250px]"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <DollarSign size={20} className="fill-current animate-bounce" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100">Table {table.id}</h4>
                                            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Requested Bill</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedTable(table)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors shadow-sm text-xs font-bold"
                                        >
                                            View
                                        </button>
                                    </motion.div>
                                ))}

                                {/* Service Requests */}
                                {serviceRequests.map(table => (
                                    <motion.div
                                        key={`req-${table.id}`}
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-xl shadow-sm flex items-center gap-4 min-w-[250px]"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                                            <Bell size={20} className="fill-current animate-bounce" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100">Table {table.id}</h4>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Calling for Service</p>
                                        </div>
                                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors shadow-sm" title="Mark Resolved">
                                            <CheckCircle size={18} />
                                        </button>
                                    </motion.div>
                                ))}

                                {/* Ready Orders */}
                                {MOCK_ORDERS.map(order => (
                                    <motion.div
                                        key={`ready-${order._id}`}
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 p-4 rounded-xl shadow-sm flex items-center gap-4 min-w-[280px]"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <ChefHat size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-gray-100">Table {order.tableId}</h4>
                                                <span className="text-[10px] bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded-full font-bold">READY</span>
                                            </div>
                                            <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate max-w-[120px]">
                                                {order.items?.map(i => i.name).join(', ')}
                                            </p>
                                        </div>
                                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
                                            Serve
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Stats / Legend */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available</span>
                                <div className="text-2xl font-bold text-green-600 mt-1">
                                    {TABLES.filter(t => t.status === 'free').length}
                                </div>
                            </div>
                            <div className="bg-card border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Occupied</span>
                                <div className="text-2xl font-bold text-red-600 mt-1">
                                    {TABLES.filter(t => t.status === 'occupied').length}
                                </div>
                            </div>
                            <div className="bg-card border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">My Tables</span>
                                <div className="text-2xl font-bold text-purple-600 mt-1">
                                    {TABLES.filter(t => t.assignedWaiterId === CURRENT_WAITER_ID).length}
                                </div>
                            </div>
                            <div className="bg-card border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total capacity</span>
                                <div className="text-2xl font-bold text-blue-600 mt-1">
                                    {TABLES.reduce((acc, t) => acc + (t.capacity || 0), 0)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <div className="w-1 h-6 bg-sunset rounded-full"></div>
                                    Floor Plan
                                </h2>

                                <div className="flex items-center bg-card rounded-lg p-1 border border-border shadow-sm">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                                            filter === 'all' ? "bg-sunset text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"
                                        )}
                                    >
                                        All Tables
                                    </button>
                                    <button
                                        onClick={() => setFilter('mine')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                                            filter === 'mine' ? "bg-sunset text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"
                                        )}
                                    >
                                        My Tables
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredTables.map((table) => {
                                    const isMyTable = table.assignedWaiterId === CURRENT_WAITER_ID;
                                    const hasRequest = table.requestService || table.requestBill; // Simplified request check

                                    return (
                                        <motion.div
                                            key={table.id}
                                            layout
                                            whileHover={{ y: -5, shadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                            onClick={() => table.status === 'occupied' && setSelectedTable(table)}
                                            className={`
                                        relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300
                                        ${hasRequest ? 'ring-4 ring-yellow-400 border-yellow-400 animate-pulse' : ''}
                                        ${table.status === 'free'
                                                    ? 'bg-card border-border hover:border-green-400'
                                                    : table.status === 'occupied'
                                                        ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                        : 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'}
                                    `}
                                        >
                                            <div className="p-5 flex flex-col items-center justify-center gap-4 relative z-10">
                                                {/* Top Badges */}
                                                <div className="absolute top-0 right-0 flex flex-col items-end">
                                                    {isMyTable && (
                                                        <div className="bg-purple-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 mb-1">
                                                            <User size={10} /> Mine
                                                        </div>
                                                    )}
                                                    {table.isReady && (
                                                        <div className="bg-green-500 text-white px-3 py-1 rounded-l-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
                                                            <CheckCircle size={10} /> Ready
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bell Icon if requested */}
                                                {table.requestService && (
                                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform z-20">
                                                        <Bell size={16} className="fill-current animate-bounce" />
                                                    </div>
                                                )}

                                                <div className={`
                                            w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm transition-transform group-hover:scale-110
                                            ${table.status === 'free' ? 'bg-green-100 text-green-600' :
                                                        table.status === 'occupied' ? 'bg-red-100 text-red-600' :
                                                            'bg-yellow-100 text-yellow-600'}
                                        `}>
                                                    {table.number}
                                                </div>

                                                <div className="text-center space-y-1">
                                                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                                        Capacity: <span className="font-semibold text-foreground">{table.capacity}</span>
                                                    </div>
                                                    {table.status === 'occupied' && (
                                                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-mono text-muted-foreground">Active</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom aesthetic line */}
                                            <div className={`h-1 w-full mt-auto ${hasRequest ? 'bg-yellow-500' : table.status === 'free' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </main>
            )}

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
                                                        ? "bg-foreground text-background border-foreground shadow-sm"
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
