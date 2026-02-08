"use client";

import React, { useEffect, useState } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ChefHat, Clock, CheckCircle, Flame, User } from "lucide-react";
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

            const fetchOrders = async () => {
                try {
                    setLoading(true);
                    const res = await axios.get(`${API_URL}/orders/active/${restaurantId}`, { withCredentials: true });
                    setOrders(res.data);
                } catch (err) {
                    console.error("Failed to load kitchen orders", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrders();
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

        socket.on("new_order", handleNewOrder);
        socket.on("order_update", handleOrderUpdate);

        return () => {
            socket.off("new_order", handleNewOrder);
            socket.off("order_update", handleOrderUpdate);
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

    return (
        <div className="flex flex-col h-screen bg-secondary/10">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ChefHat className="text-blue-500" />
                        Kitchen Display System
                    </h1>
                    <p className="text-xs text-muted-foreground truncate">{currentRestaurant.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                        <Clock size={12} /> Live Orders Connected
                    </div>
                </div>
            </header>

            {/* Orders Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex gap-6 h-full min-w-max">
                    {/* New Orders Column */}
                    <div className="w-80 flex flex-col gap-4">
                        <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                            <span>New Orders ({newOrders.length})</span>
                            <div className="h-1 flex-1 bg-blue-500/20 ml-2 rounded-full"></div>
                        </div>
                        <AnimatePresence>
                            {newOrders.map(order => (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-card p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col gap-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-xs text-muted-foreground">ID: {order._id.slice(-4)}</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-bold bg-secondary px-2 py-1 rounded">Table {order.tableNo}</span>
                                            {order.waiterId?.name && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User size={9} /> {order.waiterId.name.split(' ')[0]}</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm">
                                                <span className="font-medium text-foreground">{item.quantity}x {item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/50">
                                        <span>{getElapsed(order.createdAt)} ago</span>
                                        <button
                                            onClick={() => updateStatus(order._id, "PREPARING")}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                                        >
                                            <Flame size={12} /> Start Cooking
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {newOrders.length === 0 && <div className="text-center text-muted-foreground text-sm py-10 opacity-50">No new orders</div>}
                    </div>

                    {/* Cooking Column */}
                    <div className="w-80 flex flex-col gap-4">
                        <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                            <span>Cooking ({cookingOrders.length})</span>
                            <div className="h-1 flex-1 bg-orange-500/20 ml-2 rounded-full"></div>
                        </div>
                        <AnimatePresence>
                            {cookingOrders.map(order => (
                                <motion.div
                                    key={order._id}
                                    layoutId={order._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-orange-500 flex flex-col gap-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-xs text-muted-foreground">ID: {order._id.slice(-4)}</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-bold bg-secondary px-2 py-1 rounded">Table {order.tableNo}</span>
                                            {order.waiterId?.name && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User size={9} /> {order.waiterId.name.split(' ')[0]}</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm">
                                                <span className="font-medium text-foreground">{item.quantity}x {item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/50">
                                        <span className="text-orange-500 font-bold flex items-center gap-1">
                                            <Loader2 size={12} className="animate-spin" /> Cooking...
                                        </span>
                                        <button
                                            onClick={() => updateStatus(order._id, "READY")}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle size={12} /> Mark Ready
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {cookingOrders.length === 0 && <div className="text-center text-muted-foreground text-sm py-10 opacity-50">No orders cooking</div>}
                    </div>

                    {/* Ready Column */}
                    <div className="w-80 flex flex-col gap-4">
                        <div className="flex items-center justify-between text-muted-foreground uppercase text-xs font-bold tracking-wider mb-2">
                            <span>Ready to Serve ({readyOrders.length})</span>
                            <div className="h-1 flex-1 bg-green-500/20 ml-2 rounded-full"></div>
                        </div>
                        <AnimatePresence>
                            {readyOrders.map(order => (
                                <motion.div
                                    key={order._id}
                                    layoutId={order._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-card p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex flex-col gap-3 opacity-90"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-xs text-muted-foreground">ID: {order._id.slice(-4)}</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-bold bg-secondary px-2 py-1 rounded">Table {order.tableNo}</span>
                                            {order.waiterId?.name && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User size={9} /> {order.waiterId.name.split(' ')[0]}</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm text-muted-foreground">
                                                <span className="font-medium ">{item.quantity}x {item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/50">
                                        <span className="text-green-600 font-bold flex items-center gap-1">
                                            <CheckCircle size={12} /> Ready
                                        </span>
                                        {/* Kitchen only sees Ready status, Waiter marks Served */}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {readyOrders.length === 0 && <div className="text-center text-muted-foreground text-sm py-10 opacity-50">No ready orders</div>}
                    </div>
                </div>
            </main>
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
