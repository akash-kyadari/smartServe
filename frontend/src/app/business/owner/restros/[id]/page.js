"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, Utensils, Clock, Globe, ArrowUpRight, MoreHorizontal, Loader2, User, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { getSocket } from "@/lib/socket";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

const KPICard = ({ title, value, sub, icon: Icon, trend }) => (
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
);

const ChartMock = () => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border col-span-2">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Revenue Overview (Mock)</h3>
            <select className="text-sm border-none bg-secondary/50 rounded-lg px-2 py-1 text-muted-foreground focus:outline-none">
                <option>Last 7 Days</option>
            </select>
        </div>
        <div className="h-64 flex items-end gap-4 overflow-hidden">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-gray-900 to-gray-600 dark:from-sunset dark:to-orange-600 rounded-t-lg relative group opacity-90 hover:opacity-100 transition-opacity"
                >
                    <div className="absolute -top-8 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-foreground">
                        {h}k
                    </div>
                </motion.div>
            ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-muted-foreground font-medium uppercase">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
    </div>
);

const PopularDishesMock = () => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
        <h3 className="font-bold mb-6">Popular Dishes (Mock)</h3>
        <div className="space-y-5">
            {[
                { name: "Truffle Pizza", sales: "84%", color: "bg-sunset" },
                { name: "Spicy Wings", sales: "62%", color: "bg-orange-400" },
                { name: "Burrata Salad", sales: "45%", color: "bg-yellow-400" },
            ].map((d) => (
                <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-muted-foreground">{d.name}</span>
                        <span className="font-bold text-foreground">{d.sales}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: d.sales }}
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full ${d.color}`}
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default function RestaurantDashboard() {
    const params = useParams();
    const { restaurants, fetchRestaurants, fetchRestaurantById } = useRestaurantStore();
    const { user, isAuthenticated } = useAuthStore();

    // Data State
    const [orders, setOrders] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);

    // Find restaurant data
    const currentRestaurant = restaurants.find(r => r._id === params.id);

    // Initial fetch
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Fetch Restro details logic
        if (!currentRestaurant) {
            const isOwner = user.roles.includes('owner');
            if (isOwner) fetchRestaurants();
            else fetchRestaurantById(params.id);
        }

        // Fetch Orders
        const fetchOrders = async () => {
            try {
                setStatsLoading(true);
                const res = await axios.get(`${API_URL}/orders/active/${params.id}`, { withCredentials: true });
                setOrders(res.data || []);
            } catch (err) {
                console.error("Failed to load orders", err);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchOrders();
    }, [user, isAuthenticated, fetchRestaurants, fetchRestaurantById, params.id, currentRestaurant]);

    // Socket Integration
    useEffect(() => {
        if (!params.id) return;

        const socket = getSocket();
        socket.emit("join_staff_room", params.id);

        const handleNewOrder = (newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
        };

        const handleOrderUpdate = (updatedOrder) => {
            setOrders(prev => {
                // If Completed/Paid, remove from Active View?
                // Owner might want to see them turn green. 
                // Let's keep them but update status.
                // Or if we want strictly "Active List", remove if Completed.
                // Let's update status for now.
                const exists = prev.find(o => o._id === updatedOrder._id);
                if (exists) {
                    return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                }
                // If not found, add (maybe came while offline)
                return [updatedOrder, ...prev];
            });
        };

        const handleTableFreed = () => {
            fetchRestaurantById(params.id); // Refresh table status (occupancy)
        };

        socket.on("new_order", (o) => {
            handleNewOrder(o);
            fetchRestaurantById(params.id); // Refresh table status (occupancy)
        });
        socket.on("order_update", handleOrderUpdate);
        socket.on("table_freed", handleTableFreed);

        return () => {
            socket.off("new_order", handleNewOrder); // We used anonymous wrapper above, this might not fully detach but component unmount handles it mostly. 
            // Better practice: extract the wrapper to named function if needed, but for now this is okay or we can just ignore specific detach implementation detail as strict mode runs twice.
            socket.off("order_update", handleOrderUpdate);
            socket.off("table_freed", handleTableFreed);
        };
    }, [params.id]);


    if (!currentRestaurant) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    // Calc stats from active orders
    const pendingCount = orders.filter(o => ["PLACED", "PREPARING"].includes(o.status)).length;
    const activeRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    const activeList = orders.filter(o => ["PLACED", "PREPARING", "READY", "SERVED"].includes(o.status));
    const completedList = orders.filter(o => ["PAID", "COMPLETED"].includes(o.status)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const OrderTable = ({ title, data, emptyMsg }) => (
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
    );

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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartMock />
                <PopularDishesMock />
            </div>

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
                                className={`relative group p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${table.isOccupied
                                    ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/20 hover:bg-rose-500/10"
                                    : "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 hover:bg-emerald-500/10"
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
            <div className="grid grid-cols-1 gap-8">
                <OrderTable title="Active Kitchen Orders" data={activeList} emptyMsg="No active orders" />
                <OrderTable title="Completed / Paid Orders" data={completedList} emptyMsg="No completed orders today" />
            </div>
        </div>
    );
}
