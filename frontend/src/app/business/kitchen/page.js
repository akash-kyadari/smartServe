"use client";

import React, { useEffect, useState } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ChefHat, Clock, CheckCircle, Flame, User, Users, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RoleGuard from "@/components/auth/RoleGuard";
import { getSocket } from "@/lib/socket"; // Import Socket
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

function KitchenPageContent() {
    const { fetchRestaurantById, restaurants, isLoading: isRestroLoading } = useRestaurantStore();
    const { user } = useAuthStore();

    const rawRestroId = user?.workingAt?.[0]?.restaurantId;
    const restaurantId = (rawRestroId && typeof rawRestroId === 'object') ? rawRestroId._id : rawRestroId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    const [orders, setOrders] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(Date.now());

    // Update time every minute for "elapsed" calculation
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    // 1. Fetch Initial Data
    useEffect(() => {
        if (user && restaurantId) {
            if (!currentRestaurant) fetchRestaurantById(restaurantId);

            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [ordersRes, staffRes] = await Promise.all([
                        axios.get(`${API_URL}/orders/active/${restaurantId}`, { withCredentials: true }),
                        axios.get(`${API_URL}/restaurants/${restaurantId}/staff`, { withCredentials: true })
                    ]);
                    setOrders(ordersRes.data);
                    setStaff(staffRes.data.staff || []);
                } catch (err) {
                    console.error("Failed to load kitchen data", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user, restaurantId, currentRestaurant, fetchRestaurantById]);

    // 2. Socket Integration
    useEffect(() => {
        if (!restaurantId) return;

        const socket = getSocket();
        socket.emit("join_staff_room", restaurantId);

        const handleNewOrder = (newOrder) => {
            setOrders(prev => [...prev, newOrder]);
            // Play sound?
        };

        const handleOrderUpdate = (updatedOrder) => {
            setOrders(prev => {
                // If Completed/Served, remove from Kitchen View (or move to Done column)
                if (["SERVED", "COMPLETED", "PAID"].includes(updatedOrder.status)) {
                    return prev.filter(o => o._id !== updatedOrder._id);
                }
                // Update specific order
                const index = prev.findIndex(o => o._id === updatedOrder._id);
                if (index !== -1) {
                    const newOrders = [...prev];
                    newOrders[index] = updatedOrder;
                    return newOrders;
                }
                // If not found (maybe came in while offline?), add it if active
                if (["PLACED", "PREPARING", "READY"].includes(updatedOrder.status)) {
                    return [...prev, updatedOrder];
                }
                return prev;
            });
        };

        const handleStaffUpdate = ({ staffId, isActive }) => {
            setStaff(prev => prev.map(s => s._id === staffId ? { ...s, isActive } : s));
        };

        socket.on("new_order", handleNewOrder);
        socket.on("order_update", handleOrderUpdate);
        socket.on("staff_update", handleStaffUpdate);

        return () => {
            socket.off("new_order", handleNewOrder);
            socket.off("order_update", handleOrderUpdate);
            socket.off("staff_update", handleStaffUpdate);
        };
    }, [restaurantId]);

    // Actions
    const updateStatus = async (orderId, newStatus) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));

            await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
        } catch (err) {
            console.error("Failed to update status", err);
            // Revert handled by socket usually, or explicit fetch here
        }
    };

    if (loading || isRestroLoading || !currentRestaurant) {
        return (
            <div className="flex h-screen items-center justify-center bg-secondary/10">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    const newOrders = orders.filter(o => o.status === 'PLACED');
    const cookingOrders = orders.filter(o => o.status === 'PREPARING');
    const readyOrders = orders.filter(o => o.status === 'READY');

    const getElapsed = (createdAt) => {
        const minutes = Math.floor((now - new Date(createdAt).getTime()) / 60000);
        return minutes + 'm';
    };

    const activeStaff = staff.filter(s => s.role === 'waiter' && s.isActive);
    const offlineStaff = staff.filter(s => s.role === 'waiter' && !s.isActive);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar - Staff Status */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <h2 className="font-bold text-lg flex items-center gap-2">
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
                            <ChefHat className="text-orange-500" size={28} />
                            Kitchen Display
                        </h1>
                        <p className="text-sm text-muted-foreground">{currentRestaurant.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex gap-6 h-full min-w-max">
                        {/* New Orders Column */}
                        <div className="w-96 flex flex-col gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
                            <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                                <span className="flex items-center gap-2"><AlertCircle size={16} className="text-blue-500" /> New Orders</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{newOrders.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                <AnimatePresence>
                                    {newOrders.map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-card p-5 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow relative overflow-hidden group"
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
                        <div className="w-96 flex flex-col gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
                            <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                                <span className="flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Cooking</span>
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{cookingOrders.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                <AnimatePresence>
                                    {cookingOrders.map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className="bg-card p-5 rounded-xl shadow-md border-l-4 border-orange-500 relative group"
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
                        <div className="w-96 flex flex-col gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
                            <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                                <span className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Ready to Serve</span>
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{readyOrders.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                <AnimatePresence>
                                    {readyOrders.map(order => (
                                        <motion.div
                                            key={order._id}
                                            layoutId={order._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-card p-5 rounded-xl shadow-sm border-l-4 border-green-500 opacity-80 hover:opacity-100 transition-opacity"
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

export default function KitchenPage() {
    return (
        <RoleGuard allowedRoles={['kitchen', 'manager', 'owner']} requireRestaurant={true}>
            <KitchenPageContent />
        </RoleGuard>
    );
}
