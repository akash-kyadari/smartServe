"use client";

import React, { useEffect, useState } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ClipboardList, CheckCircle, Bell, Clock, ChefHat, AlertCircle, User, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RoleGuard from "@/components/auth/RoleGuard";
import { getSocket } from "@/lib/socket";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

function WaiterPOSPageContent() {
    const { fetchRestaurantById, restaurants, isLoading } = useRestaurantStore();
    const { user } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);

    const rawRestroId = user?.workingAt?.[0]?.restaurantId;
    const restaurantId = (rawRestroId && typeof rawRestroId === 'object') ? rawRestroId._id : rawRestroId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // Initial Fetch (Restaurant + Orders)
    useEffect(() => {
        if (user && restaurantId) {
            if (!currentRestaurant || !currentRestaurant.tables) {
                fetchRestaurantById(restaurantId);
            }

            // Fetch Active Orders
            const fetchOrders = async () => {
                try {
                    const res = await axios.get(`${API_URL}/orders/active/${restaurantId}`, { withCredentials: true });
                    setOrders(res.data);
                } catch (err) {
                    console.error("Failed to load active orders", err);
                }
            };
            fetchOrders();
        }
    }, [user, restaurantId, currentRestaurant, fetchRestaurantById]);

    // Socket Integration for Realtime Updates
    useEffect(() => {
        if (!restaurantId) return;

        const socket = getSocket();
        socket.emit("join_staff_room", restaurantId);

        const handleUpdate = (data) => {
            console.log("Realtime Update Received:", data);
            fetchRestaurantById(restaurantId);
        };

        const handleNewOrder = (newOrder) => {
            // Filter for Waiters: Only accept if assigned to them (or they are not just a waiter)
            const isJustWaiter = user.roles.includes('waiter') && !user.roles.includes('owner') && !user.roles.includes('manager');
            if (isJustWaiter && newOrder.waiterId !== user._id) return;

            setOrders(prev => [...prev, newOrder]);
            fetchRestaurantById(restaurantId);
        };

        const handleOrderUpdate = (updatedOrder) => {
            // Filter for Waiters
            const isJustWaiter = user.roles.includes('waiter') && !user.roles.includes('owner') && !user.roles.includes('manager');
            if (isJustWaiter && updatedOrder.waiterId !== user._id) return;

            setOrders(prev => {
                const index = prev.findIndex(o => o._id === updatedOrder._id);
                if (index !== -1) {
                    // Update existing
                    const next = [...prev];
                    next[index] = updatedOrder;
                    return next;
                }
                // Add if not present (e.g. status change from irrelevant to relevant)
                if (['PLACED', 'PREPARING', 'READY'].includes(updatedOrder.status)) {
                    return [...prev, updatedOrder];
                }
                return prev;
            });
            fetchRestaurantById(restaurantId);
        };

        socket.on("new_order", handleNewOrder);
        socket.on("order_update", handleOrderUpdate);
        socket.on("table_freed", handleUpdate);
        socket.on("table_service_update", handleUpdate);

        return () => {
            socket.off("new_order", handleNewOrder);
            socket.off("order_update", handleOrderUpdate);
            socket.off("table_freed", handleUpdate);
            socket.off("table_service_update", handleUpdate);
        };
    }, [restaurantId, fetchRestaurantById]);

    // Actions
    const handleResolveService = async (tableId) => {
        try {
            await axios.post(`${API_URL}/restaurants/public/${restaurantId}/table/${tableId}/service`, { active: false });
            // Optimization: Update local state immediately
            fetchRestaurantById(restaurantId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkServed = async (orderId) => {
        try {
            // Optimistic Update
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "SERVED" } : o));
            await axios.put(`${API_URL}/orders/${orderId}/status`, { status: "SERVED" }, { withCredentials: true });
            // Close modal if order matches
            if (selectedTable?.currentOrderId === orderId) {
                setSelectedTable(null);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const handleFreeTable = async (tableId) => {
        if (!confirm("Are you sure you want to close this session? This will free the table.")) return;
        try {
            await axios.post(`${API_URL}/orders/free-table`, {
                restaurantId,
                tableId
            }, { withCredentials: true });
            setSelectedTable(null);
            fetchRestaurantById(restaurantId);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to close session");
        }
    };


    // Normalize tables data
    const tables = currentRestaurant?.tables?.map(t => ({
        id: t._id,
        number: `T${t.tableNumber}`,
        status: t.isOccupied ? 'occupied' : 'free',
        capacity: t.capacity,
        isOccupied: t.isOccupied,
        assignedWaiterId: t.assignedWaiterId,
        requestService: t.requestService,
        currentOrderId: t.currentOrderId
    })) || [];

    // Filter tasks (Service Requests)
    const serviceRequests = tables.filter(t => t.requestService);

    // Find active order for selected table
    const selectedOrder = selectedTable && orders.find(o => o.tableId === selectedTable.id && o.status !== 'COMPLETED');

    if (isLoading && !currentRestaurant) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-sunset" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-secondary/10 overflow-hidden relative">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ClipboardList className="text-sunset" />
                        POS Terminal
                    </h1>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        Waiter Panel <span className="w-1 h-1 rounded-full bg-muted-foreground"></span> {user?.name}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {serviceRequests.length > 0 && (
                        <div className="flex items-center gap-2 text-xs font-bold bg-yellow-500/10 text-yellow-600 px-3 py-1.5 rounded-full border border-yellow-200 animate-pulse">
                            <Bell size={12} className="fill-yellow-600" />
                            {serviceRequests.length} Request{serviceRequests.length !== 1 && 's'}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs font-medium bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full border border-green-200">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Live
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Priority Actions Section */}
                    {(serviceRequests.length > 0 || orders.some(o => o.status === 'READY')) && (
                        <div className="bg-background/50 border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Priority Tasks
                            </h2>
                            <div className="flex flex-wrap gap-4">
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
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100">Table {table.number.replace('T', '')}</h4>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Calling for Service</p>
                                        </div>
                                        <button
                                            onClick={() => handleResolveService(table.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors shadow-sm"
                                            title="Mark Resolved"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    </motion.div>
                                ))}

                                {/* Ready Orders */}
                                {orders.filter(o => o.status === 'READY').map(order => {
                                    // Find table info for this order
                                    const table = tables.find(t => t.id === order.tableId);
                                    return (
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
                                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">Table {table ? table.number.replace('T', '') : '?'}</h4>
                                                    <span className="text-[10px] bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded-full font-bold">READY</span>
                                                </div>
                                                <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate max-w-[120px]">
                                                    {order.items.map(i => i.name).join(', ')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleMarkServed(order._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                Serve
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Stats / Legend */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available</span>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                                {tables.filter(t => t.status === 'free').length}
                            </div>
                        </div>
                        <div className="bg-card border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Occupied</span>
                            <div className="text-2xl font-bold text-red-600 mt-1">
                                {tables.filter(t => t.status === 'occupied').length}
                            </div>
                        </div>
                        <div className="bg-card border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">My Tables</span>
                            <div className="text-2xl font-bold text-purple-600 mt-1">
                                {tables.filter(t => t.assignedWaiterId === user?._id).length}
                            </div>
                        </div>
                        <div className="bg-card border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total capacity</span>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                {tables.reduce((acc, t) => acc + (t.capacity || 0), 0)}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-sunset rounded-full"></div>
                            Floor Plan
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {tables.map((table) => {
                                const isMyTable = table.assignedWaiterId === user?._id;
                                const hasRequest = table.requestService;
                                const tableOrder = orders.find(o => o.tableId === table.id && o.status !== 'COMPLETED');
                                const isReady = tableOrder?.status === 'READY';

                                return (
                                    <motion.div
                                        key={table.id || table.number}
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
                                                {isReady && (
                                                    <div className="bg-green-500 text-white px-3 py-1 rounded-l-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
                                                        <CheckCircle size={10} /> Ready
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bell Icon if requested */}
                                            {hasRequest && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleResolveService(table.id); }}
                                                    className="absolute top-2 left-2 bg-yellow-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
                                                    title="Mark as Attended"
                                                >
                                                    <Bell size={16} className="fill-current animate-bounce" />
                                                </button>
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

            {/* Order Management Modal */}
            <AnimatePresence>
                {selectedTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedTable(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
                        >
                            <div className="p-4 bg-secondary/50 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    Manage Table {selectedTable.number}
                                    {selectedTable.requestService && <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">Needs Service</span>}
                                </h3>
                                <button onClick={() => setSelectedTable(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={20} /></button>
                            </div>

                            <div className="p-6">
                                {selectedOrder ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Order #{selectedOrder._id.slice(-4)}</span>
                                            <span className={`px-2 py-0.5 rounded textxs font-bold uppercase ${selectedOrder.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {selectedOrder.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="font-medium">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            {selectedOrder.status === 'READY' && (
                                                <button
                                                    onClick={() => handleMarkServed(selectedOrder._id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={18} /> Mark Served
                                                </button>
                                            )}
                                        </div>
                                        {selectedOrder.status === 'SERVED' && (
                                            <div className="text-center text-sm text-green-600 font-medium py-2 bg-green-50 rounded-lg">
                                                Order Served
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No active orders for this table.</p>
                                    </div>
                                )}

                                {selectedTable.requestService && (
                                    <button
                                        onClick={() => { handleResolveService(selectedTable.id); setSelectedTable(null); }}
                                        className="w-full mt-4 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 py-2.5 rounded-xl font-bold transition-colors"
                                    >
                                        Mark Request Addressed
                                    </button>
                                )}

                                {/* Close Session Button */}
                                {selectedTable.isOccupied && (
                                    <button
                                        onClick={() => handleFreeTable(selectedTable.id)}
                                        className="w-full mt-4 bg-red-500/10 text-red-600 hover:bg-red-500/20 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={18} /> Close Session & Free Table
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function WaiterPOSPage() {
    return (
        <RoleGuard allowedRoles={['waiter', 'manager', 'owner']} requireRestaurant={true}>
            <WaiterPOSPageContent />
        </RoleGuard>
    );
}
