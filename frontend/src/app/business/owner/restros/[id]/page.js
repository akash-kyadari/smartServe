"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, Utensils, Clock, Globe, ArrowUpRight, MoreHorizontal, Loader2, User, LayoutGrid, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { getSocket } from "@/lib/socket";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL) + "/api";

const KPICard = React.memo(({ title, value, sub, icon: Icon, trend }) => (
    <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border relative overflow-hidden group">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold mt-2">{value}</h3>
            </div>
            <div className="p-3 bg-secondary rounded-lg group-hover:bg-sunset/10 group-hover:text-sunset transition-colors">
                <Icon size={20} />
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
            {trend && (
                <span className="text-green-600 dark:text-green-400 font-bold flex items-center bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                    <ArrowUpRight size={12} className="mr-1" /> {trend}
                </span>
            )}
            <span className="text-muted-foreground">{sub}</span>
        </div>
    </div>
));

const RevenueChart = React.memo(({ data }) => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border col-span-2">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Revenue Overview (Last 7 Days)</h3>
        </div>
        <div className="h-64 flex items-end gap-4 overflow-hidden">
            {data?.map((d, i) => (
                <motion.div
                    key={d.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.revenue / (Math.max(...data.map(x => x.revenue)) || 1)) * 100}%` }} // Normalize height
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-gray-900 to-gray-600 dark:from-sunset dark:to-orange-600 rounded-t-lg relative group opacity-90 hover:opacity-100 transition-opacity min-h-[4px]"
                >
                    <div className="absolute -top-8 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-foreground">
                        ₹{d.revenue}
                    </div>
                </motion.div>
            ))}
            {(!data || data.length === 0) && <div className="w-full text-center text-muted-foreground self-center">No revenue data</div>}
        </div>
        <div className="flex justify-between mt-4 text-xs text-muted-foreground font-medium uppercase">
            {data?.map(d => <span key={d.date}>{d.day}</span>)}
        </div>
    </div>
));

const PopularDishes = React.memo(({ data }) => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
        <h3 className="font-bold mb-6">Popular Dishes (Last 30 Days)</h3>
        <div className="space-y-5">
            {data?.map((d) => (
                <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-muted-foreground">{d.name}</span>
                        <span className="font-bold text-foreground">{d.sales} ({d.count})</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: d.sales.replace('%', '') + '%' }} // Ensure % for css width
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full ${d.color}`}
                        />
                    </div>
                </div>
            ))}
            {(!data || data.length === 0) && <div className="text-center text-muted-foreground py-8">No sales data yet</div>}
        </div>
    </div>
));

const StaffOverview = React.memo(({ staff }) => {
    // Sort: Active first, then by role
    const sortedStaff = [...(staff || [])].sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
    });

    return (
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border h-fit">
            <h3 className="font-bold mb-4 flex items-center justify-between">
                Staff Status
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {staff?.filter(s => s.isActive).length || 0} Online
                </span>
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sortedStaff.map((s) => (
                    <div key={s._id} className={`flex items-center justify-between ${!s.isActive && 'opacity-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${s.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-muted-foreground'}`}>
                                {(s.user?.name || s.name || '?').charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-none">{s.user?.name || 'Unknown'}</p>
                                <p className="text-[10px] uppercase text-muted-foreground">{s.role}</p>
                            </div>
                        </div>
                        {s.isActive ? (
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                        ) : (
                            <span className="text-[10px] text-muted-foreground">Offline</span>
                        )}
                    </div>
                ))}
                {(!staff || staff.length === 0) && <p className="text-muted-foreground text-sm italic">No staff members found.</p>}
            </div>
        </div>
    );
});

const LowStockAlert = React.memo(({ menu }) => {
    const lowStockItems = menu?.filter(i => i.stock !== null && i.stock !== undefined && i.stock <= 5 && i.isAvailable) || [];
    if (lowStockItems.length === 0) return null;

    return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> Low Stock Alert
            </h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {lowStockItems.map(item => (
                    <div key={item._id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[70%]">{item.name}</span>
                        <span className="font-bold text-red-600 dark:text-red-400 bg-white dark:bg-black/20 px-2 py-0.5 rounded-full text-xs">
                            {item.stock} left
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default function RestaurantDashboard() {
    const params = useParams();
    const { restaurants, fetchRestaurants, fetchRestaurantById, dashboardData, setDashboardData } = useRestaurantStore();
    const { user, isAuthenticated } = useAuthStore();

    // Data State (Initialize from store if available)
    const stored = dashboardData[params.id] || {};
    const orders = stored.activeOrders || []; // Use derived state from store
    const [analytics, setAnalytics] = useState(stored.analytics || { revenue: [], popularDishes: [] });
    // Stats loading is true only if we have NO orders and NO analytics
    const [statsLoading, setStatsLoading] = useState(!stored.activeOrders);
    const [selectedTable, setSelectedTable] = useState(null);

    // Find restaurant data
    const currentRestaurant = restaurants.find(r => r._id === params.id);

    // Initial fetch
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const controller = new AbortController();

        // Fetch Restro details logic
        // Deduplicate this too
        if (!currentRestaurant) {
            const isOwner = user.roles.includes('owner');
            // Assuming store handles deduplication or passing signal not supported by store yet
            // If store doesn't support signal, we can at least control local fetch below
            if (isOwner) fetchRestaurants();
            else fetchRestaurantById(params.id);
        }

        // Fetch Orders & Analytics
        const fetchData = async () => {
            // IF we have data, DO NOT FETCH. Layout socket listeners keep it fresh.
            if (stored.activeOrders) {
                setStatsLoading(false); // Ensure loading is false
                return;
            }

            try {
                // Only show loading if we don't have data
                if (!stored.activeOrders) setStatsLoading(true);

                const signal = controller.signal;

                const [ordersRes, analyticsRes] = await Promise.all([
                    axios.get(`${API_URL}/orders/active/${params.id}`, { withCredentials: true, signal }),
                    (user.roles.includes('owner') || user.roles.includes('manager')) ?
                        axios.get(`${API_URL}/restaurants/analytics/${params.id}`, { withCredentials: true, signal }) : Promise.resolve({ data: {} })
                ]);

                if (signal.aborted) return;

                setDashboardData(params.id, { activeOrders: ordersRes.data || [] });

                if (analyticsRes.data?.success) {
                    setAnalytics(analyticsRes.data);
                    setDashboardData(params.id, { analytics: analyticsRes.data });
                }
            } catch (err) {
                if (axios.isCancel(err) || err.name === 'CanceledError') return;
                console.error("Failed to load dashboard data", err);
            } finally {
                if (!controller.signal.aborted) setStatsLoading(false);
            }
        };

        fetchData();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, isAuthenticated]); // Reduced dependencies to avoid re-fetch loops

    // Socket Integration handled in Layout.js


    if (!currentRestaurant) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    // Calc stats from active orders
    const pendingCount = orders.filter(o => ["PLACED", "PREPARING"].includes(o.status)).length;
    const activeRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    const activeList = orders.filter(o => ["PLACED", "PREPARING", "READY", "SERVED"].includes(o.status));
    const completedList = orders.filter(o => ["PAID", "COMPLETED"].includes(o.status)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Moved outside component to prevent re-creation
    const OrderTable = React.memo(({ title, data, emptyMsg }) => (
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                    {title}
                    <span className="bg-secondary text-xs px-2 py-0.5 rounded-full text-muted-foreground">{data.length}</span>
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Order ID</th>
                            <th className="px-6 py-3">Table</th>
                            <th className="px-6 py-3">Items</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Assigned To</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">
                                    {emptyMsg}
                                </td>
                            </tr>
                        ) : (
                            data.map((order) => (
                                <tr key={order._id} className="hover:bg-secondary/50 transition-colors">
                                    <td className="px-6 py-4 font-medium font-mono">#{order._id.slice(-4)}</td>
                                    <td className="px-6 py-4 text-muted-foreground">Table {order.tableNo}</td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {order.items?.map(i => `${i.quantity}x ${i.name}`).join(", ").slice(0, 30)}
                                        {order.items?.length > 1 && "..."}
                                    </td>
                                    <td className="px-6 py-4 font-bold">₹{order.totalAmount}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                                        {order.waiterId?.name ? (
                                            <span className="flex items-center gap-1"><User size={12} /> {order.waiterId.name}</span>
                                        ) : (
                                            <span className="opacity-50">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' :
                                                order.status === 'READY' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'SERVED' ? 'bg-purple-100 text-purple-700' :
                                                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-gray-100 text-gray-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    ));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground text-sm">
                    Overview for <span className="font-semibold text-sunset">{currentRestaurant.name}</span>
                    {currentRestaurant.isAC && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">AC</span>}
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Projected Revenue" value={`₹${activeRevenue}`} sub="From active orders" trend="" icon={DollarSign} />
                <KPICard title="Total Tables" value={currentRestaurant.tables?.length || 0} sub="Capacity" trend="" icon={Utensils} />
                <KPICard title="Pending Orders" value={pendingCount} sub="Needs Attention" trend="" icon={Clock} />
                <KPICard title="Online Status" value={currentRestaurant.isActive ? "Active" : "Inactive"} sub="Store visibility" trend="" icon={Globe} />
            </div>

            {/* Charts & Staff */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RevenueChart data={analytics.revenue} />
                <div className="space-y-6">
                    <LowStockAlert menu={currentRestaurant.menu} />
                    <PopularDishes data={analytics.popularDishes} />
                    <StaffOverview staff={currentRestaurant.staff} />
                </div>
            </div>

            {/* Table Details Modal */}
            <AnimatePresence>
                {selectedTable && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedTable(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-background text-foreground w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
                                <div>
                                    <h3 className="font-bold text-xl flex items-center gap-2">
                                        Table {selectedTable.tableNumber}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${selectedTable.isOccupied ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {selectedTable.isOccupied ? 'Occupied' : 'Free'}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">Capacity: {selectedTable.capacity} Persons</p>
                                </div>
                                <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-secondary rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Assigned Waiter */}
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <User size={14} /> Assigned Staff
                                    </h4>
                                    {selectedTable.assignedWaiterId ? (() => {
                                        // Logic to find staff name
                                        const waiterId = selectedTable.assignedWaiterId._id || selectedTable.assignedWaiterId;
                                        const staffMember = currentRestaurant.staff?.find(s => {
                                            const sId = s.user?._id || s.user;
                                            return sId?.toString() === waiterId?.toString();
                                        });
                                        const waiterName = staffMember?.user?.name || selectedTable.assignedWaiterId.name || 'Unknown Staff';

                                        return (
                                            <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg border border-border/50">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {waiterName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{waiterName}</p>
                                                    <p className="text-xs text-muted-foreground">Waiter</p>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div className="text-sm text-muted-foreground italic">No waiter assigned currently.</div>
                                    )}
                                </div>

                                {/* Active Orders */}
                                {selectedTable.isOccupied && (
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            <Utensils size={14} /> Active Orders
                                        </h4>
                                        {(() => {
                                            const activeOrders = orders.filter(o => o.tableId === selectedTable._id && !o.isSessionClosed && o.status !== 'COMPLETED');
                                            if (activeOrders.length === 0) return <p className="text-sm text-muted-foreground">No active orders found for this session.</p>;

                                            const total = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                                            const paid = activeOrders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                                            const payable = total - paid;

                                            return (
                                                <div className="space-y-3">
                                                    {activeOrders.map(order => (
                                                        <div key={order._id} className="bg-secondary/20 border border-border rounded-lg p-3 text-sm transition-colors hover:bg-secondary/30">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-mono text-xs text-muted-foreground">#{order._id.slice(-4)}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                                                                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                                            'bg-orange-100 text-orange-700'
                                                                    }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1 mb-2">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between">
                                                                        <span>{item.quantity}x {item.name}</span>
                                                                        <span className="font-medium">₹{item.price * item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                                                                <span>Order Total</span>
                                                                <span>₹{order.totalAmount}</span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Session Summary */}
                                                    <div className="bg-card border-2 border-sunset/20 rounded-xl p-4 shadow-sm space-y-2 mt-4">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground">Session Total</span>
                                                            <span className="font-bold">₹{total}</span>
                                                        </div>
                                                        {paid > 0 && (
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-emerald-600">Previously Paid</span>
                                                                <span className="font-bold text-emerald-600">-₹{paid}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center pt-2 border-t border-border">
                                                            <span className="font-bold">Bill Payable</span>
                                                            <span className="text-xl font-black text-sunset">₹{payable}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floor Status (Live) */}
            <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <LayoutGrid size={20} className="text-sunset" /> Floor Status
                    </h3>
                    <div className="flex gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span> Available</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span> Occupied</span>
                    </div>
                </div>

                {currentRestaurant.tables?.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {currentRestaurant.tables.map((table) => (
                            <div
                                key={table._id}
                                onClick={() => setSelectedTable(table)}
                                className={`relative group p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${table.isOccupied
                                    ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/20 hover:bg-rose-500/10 hover:scale-105 shadow-sm"
                                    : "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 hover:bg-emerald-500/10 hover:scale-105 shadow-sm"
                                    }`}
                            >
                                <span className={`font-bold text-lg ${table.isOccupied ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    T-{table.tableNumber}
                                </span>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <User size={12} />
                                    <span>{table.capacity} Seats</span>
                                </div>

                                {table.isOccupied && (
                                    <div className="absolute -top-2 -right-2">
                                        <span className="flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border">
                        <Utensils size={32} className="mx-auto mb-3 opacity-20" />
                        <p>No tables configured for this restaurant.</p>
                    </div>
                )}
            </div>

            {/* Orders Tables */}
            < div className="grid grid-cols-1 gap-8" >
                <OrderTable title="Active Kitchen Orders" data={activeList} emptyMsg="No active orders" />
                <OrderTable title="Completed / Paid Orders" data={completedList} emptyMsg="No completed orders today" />
            </div >
        </div >
    );
}
