"use client";

import React, { useEffect, useState, useCallback } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ClipboardList, CheckCircle, Bell, ChefHat, DollarSign, User } from "lucide-react"; // Removed unused imports
import { motion, AnimatePresence } from "framer-motion";
import RoleGuard from "@/components/auth/RoleGuard";
import socketService from "@/services/socketService";
import axios from "axios";
import TableDetailsModal from "@/components/business/waiter/TableDetailsModal";

const API_URL = (process.env.NEXT_PUBLIC_API_URL) + "/api";

function WaiterPOSPageContent() {
    const { fetchRestaurantById, restaurants, isLoading, updateTableStatus } = useRestaurantStore();
    const { user } = useAuthStore();
    const userId = user?._id || user?.id;
    const [orders, setOrders] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isRestroActive, setIsRestroActive] = useState(true);

    // Update title
    useEffect(() => {
        document.title = "Waiter Workspace | Smart Serve";
    }, []);

    const rawRestroId = user?.workingAt?.[0]?.restaurantId;
    const restaurantId = (rawRestroId && typeof rawRestroId === 'object') ? rawRestroId._id : rawRestroId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // Determines initial online status from user profile or local state
    useEffect(() => {
        // Priority 1: Check real-time restaurant staff data (most accurate)
        if (currentRestaurant && userId) {
            const staffMember = currentRestaurant.staff?.find(s => {
                const sId = s.user?._id || s.user;
                return sId?.toString() === userId?.toString();
            });

            if (staffMember) {
                // Only update if explicit status is available
                // console.log("Staff member found in restro data:", staffMember.user, "Active:", staffMember.isActive);
                setIsOnline(staffMember.isActive);
            } else {
                // Do NOT revert to false here. 
                // If the user isn't found in the staff list (e.g., during a partial update or race condition),
                // we should trust the local state or previous state rather than forcing them offline.
                console.warn("Staff member not found in restaurant staff list during sync:", userId);
            }

            // Check Restaurant Status
            if (currentRestaurant.isActive === false || currentRestaurant.isOpen === false) {
                setIsRestroActive(false);
            } else {
                setIsRestroActive(true);
            }
        }
        // Priority 2: Fallback Logic Removed
        // We do NOT want to use 'workingAt' snapshot from login because it is stale.
        // If real-time restaurant data (Priority 1) didn't find the user, we should just keep current state.
        /*
        else if (user && restaurantId && !isLoading) {
             const employment = user.workingAt?.find(w => 
                 (w.restaurantId === restaurantId || w.restaurantId?._id === restaurantId)
             );
             setIsOnline(employment?.isActive ?? true);
        }
        */
    }, [user, restaurantId, currentRestaurant, userId, isLoading]);

    const toggleOnlineStatus = async () => {
        try {
            const newState = !isOnline; // Desired state

            // Optimistic Update
            setIsOnline(newState);

            await axios.put(`${API_URL}/restaurants/${restaurantId}/staff/status`, {
                staffId: userId,
                active: newState
            }, { withCredentials: true });

        } catch (err) {
            console.error("Failed to toggle status", err);
            // Revert State
            setIsOnline(isOnline);
            // Show Alert
            alert(err.response?.data?.message || "Failed to update status. Please try again.");
        }
    };

    // Centralized Data Fetch
    const fetchData = useCallback(async () => {
        if (!restaurantId) return;

        // 1. Fetch Restaurant Data (Tables)
        await fetchRestaurantById(restaurantId);

        // 2. Fetch Active Orders
        try {
            const res = await axios.get(`${API_URL}/orders/active/${restaurantId}`, { withCredentials: true });
            let fetchedOrders = res.data;

            // Filter out closed sessions
            fetchedOrders = fetchedOrders.filter(o => !o.isSessionClosed);

            // Filter for Waiters: Only show their assigned orders logic
            const isJustWaiter = user.roles.includes('waiter') && !user.roles.includes('owner') && !user.roles.includes('manager');
            if (isJustWaiter) {
                fetchedOrders = fetchedOrders.filter(o => {
                    const wId = o.waiterId?._id || o.waiterId;
                    return wId?.toString() === userId?.toString();
                });
            }

            setOrders(fetchedOrders);
        } catch (err) {
            console.error("Failed to load active orders", err);
        }
    }, [restaurantId, user, fetchRestaurantById, userId]);

    // Initial Load
    useEffect(() => {
        if (user && restaurantId) {
            fetchData();
        }
    }, [user, restaurantId, fetchData]);

    // Socket Integration
    useEffect(() => {
        if (!restaurantId) return;

        socketService.connect();
        console.log("Joined Staff Room:", restaurantId);
        socketService.joinStaffRoom(restaurantId, userId);
        setIsOnline(true); // Optimistically set online on join

        // Service/Bill Updates
        const handleServiceUpdate = (data) => {
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, { requestService: data.requestService });
            } else {
                fetchData();
            }
        };

        const handleBillUpdate = (data) => {
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, { requestBill: data.requestBill });
                // Notify if for me
                if (data.requestBill && (data.assignedWaiterId === userId || user.roles.includes('manager') || user.roles.includes('owner'))) {
                    console.log("New Bill Request for your table!");
                }
            } else {
                fetchData();
            }
        };

        const handleTableFreed = (data) => {
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, {
                    isOccupied: false,
                    currentOrderId: null,
                    assignedWaiterId: null,
                    requestService: false,
                    requestBill: false
                });
                // Also remove orders for this table locally
                setOrders(prev => prev.filter(o => o.tableId !== data.tableId));
            } else {
                fetchData();
            }
        };

        const handleNewOrder = (newOrder) => {
            console.log("Socket: New Order Received", newOrder);

            // Update Orders List
            const assignedId = newOrder.waiterId?._id || newOrder.waiterId;
            const isJustWaiter = user.roles.includes('waiter') && !user.roles.includes('owner') && !user.roles.includes('manager');

            // Show order if I'm not just a waiter, OR if it's assigned to me
            if (!isJustWaiter || (assignedId && userId && assignedId.toString() === userId.toString())) {
                setOrders(prev => {
                    if (prev.find(o => o._id === newOrder._id)) return prev;
                    return [newOrder, ...prev];
                });
            }

            // Update Table Status (Critical for Red Color)
            if (newOrder.tableId) {
                updateTableStatus(restaurantId, newOrder.tableId, {
                    isOccupied: true,
                    currentOrderId: newOrder._id
                });
            }
        };

        const handleOrderUpdate = (updatedOrder) => {
            console.log("Socket: Order Update Received", updatedOrder.status);
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        };

        const handleStaffUpdate = ({ staffId, isActive }) => {
            if (staffId === userId || staffId === user?._id) {
                setIsOnline(isActive);
            }
        };

        const handleRestroStatusUpdate = (status) => {
            console.log("Restro Status Update:", status);
            if (status.isActive !== undefined && !status.isActive) setIsRestroActive(false);
            else if (status.isOpen !== undefined && !status.isOpen) setIsRestroActive(false);
            else setIsRestroActive(true);
            fetchData();
        };

        socketService.onNewOrder(handleNewOrder);
        socketService.onOrderUpdate(handleOrderUpdate);
        socketService.onTableFreed(handleTableFreed);
        socketService.onTableServiceUpdate(handleServiceUpdate);
        socketService.onTableBillUpdate(handleBillUpdate);
        socketService.onStaffUpdate(handleStaffUpdate);
        socketService.onRestaurantStatusUpdate(handleRestroStatusUpdate);

        return () => {
            socketService.offNewOrder(handleNewOrder);
            socketService.offOrderUpdate(handleOrderUpdate);
            socketService.offTableFreed(handleTableFreed);
            socketService.offTableServiceUpdate(handleServiceUpdate);
            socketService.offTableBillUpdate(handleBillUpdate);
            socketService.offStaffUpdate(handleStaffUpdate);
            socketService.offRestaurantStatusUpdate(handleRestroStatusUpdate);
        };
    }, [restaurantId, user, fetchData, userId, updateTableStatus]);

    // Service Request Action (for main/dashboard view)
    const handleResolveService = async (tableId) => {
        try {
            // Optimistic Update
            updateTableStatus(restaurantId, tableId, { requestService: false });

            await axios.post(`${API_URL}/restaurants/public/${restaurantId}/table/${tableId}/service`, { active: false });
            // Socket will confirm, no need to fetch
        } catch (err) {
            console.error(err);
            fetchData();
        }
    };

    // Quick Serve Action (for dashboard cards)
    const handleMarkServed = async (orderId) => {
        try {
            // Optimistic
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "SERVED" } : o));
            await axios.put(`${API_URL}/orders/${orderId}/status`, { status: "SERVED" }, { withCredentials: true });
        } catch (err) {
            console.error(err);
            fetchData();
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
        requestBill: t.requestBill,
        currentOrderId: t.currentOrderId
    })) || [];

    // Filter tasks
    const serviceRequests = tables.filter(t => t.requestService);
    // Bill Requests: Show only if assigned to me OR I am manager/owner
    const billRequests = tables.filter(t => t.requestBill && (
        user.roles.includes('owner') ||
        user.roles.includes('manager') ||
        t.assignedWaiterId === userId
    ));

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
            <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center shadow-sm z-10 gap-3 md:gap-0">
                <div className="flex justify-between items-center w-full md:w-auto">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                            <ClipboardList className="text-sunset" size={20} />
                            POS Terminal
                        </h1>
                        <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 mt-0.5 md:mt-1">
                            Waiter Panel <span className="w-1 h-1 rounded-full bg-muted-foreground"></span> {user?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        <span className="text-xs font-medium text-foreground">{isOnline ? 'Online' : 'Offline'}</span>
                        <button
                            onClick={toggleOnlineStatus}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sunset focus:ring-offset-2 ml-1 ${isOnline ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span className="sr-only">Toggle Online Status</span>
                            <span
                                className={`${isOnline ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1 md:pb-0">
                    <div className="hidden md:flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        <span className="text-xs font-medium text-foreground">{isOnline ? 'On' : 'Off'}</span>
                        <button
                            onClick={toggleOnlineStatus}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sunset focus:ring-offset-2 ml-2 ${isOnline ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                            <span
                                className={`${isOnline ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                        {billRequests.length > 0 && (
                            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold bg-blue-500/10 text-blue-600 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-blue-200 animate-pulse whitespace-nowrap">
                                <DollarSign size={12} className="fill-blue-600" />
                                {billRequests.length} Bills
                            </div>
                        )}
                        {serviceRequests.length > 0 && (
                            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-yellow-200 animate-pulse whitespace-nowrap">
                                <Bell size={12} className="fill-yellow-600" />
                                {serviceRequests.length} Reqs
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-medium bg-green-500/10 text-green-600 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-green-200 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Live
                        </div>
                    </div>
                </div>
            </header>

            {/* Restaurant Inactive Overlay */}
            {!isRestroActive && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/95 backdrop-blur-sm z-20">
                    <div className="bg-destructive/10 p-6 rounded-full mb-4 animate-pulse">
                        <span className="text-4xl">🚫</span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Restaurant Paused</h2>
                    <p className="mt-2 text-muted-foreground max-w-md">Operations are currently halted by the administrator.</p>
                </div>
            )}

            {/* Offline Overlay */}
            {isRestroActive && !isOnline && (
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
                        onClick={toggleOnlineStatus}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-green-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        Go Online ⚡
                    </button>
                </div>
            )}

            {/* Main Content */}
            {isRestroActive && isOnline && (
                <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Priority Actions Section */}
                        {(serviceRequests.length > 0 || billRequests.length > 0 || orders.some(o => o.status === 'READY')) && (
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
                                                <h4 className="font-bold text-gray-900 dark:text-gray-100">Table {table.number.replace('T', '')}</h4>
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
                                                        {order.items?.map(i => i.name).join(', ')}
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
                                    {tables.filter(t => t.assignedWaiterId && userId && t.assignedWaiterId.toString() === userId.toString()).length}
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
                                    // Robust check for ownership: Table assigned OR Active Order assigned
                                    const tableOrder = orders.find(o => o.tableId === table.id && !o.isSessionClosed && o.status !== 'COMPLETED');
                                    const isAttachedToOrder = tableOrder && tableOrder.waiterId && (tableOrder.waiterId._id || tableOrder.waiterId).toString() === userId.toString();

                                    const assignedId = table.assignedWaiterId ? (table.assignedWaiterId._id || table.assignedWaiterId) : null;
                                    const isAssignedToTable = assignedId && userId && assignedId.toString() === userId.toString();

                                    const isMyTable = isAssignedToTable || isAttachedToOrder;
                                    const isReady = tableOrder?.status === 'READY';
                                    const hasRequest = table.requestService;

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
            )}
            <AnimatePresence>
                {selectedTable && (
                    <TableDetailsModal
                        table={selectedTable}
                        orders={orders}
                        restaurantId={restaurantId}
                        onClose={() => setSelectedTable(null)}
                        onUpdate={fetchData}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}

export default function WaiterPOSPage() {
    return (
        <RoleGuard allowedRoles={['waiter', 'manager', 'owner']} requireRestaurant={true}>
            <WaiterPOSPageContent />
        </RoleGuard>
    );
}
