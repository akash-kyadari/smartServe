"use client";

import React, { useEffect } from "react";
import { DollarSign, Utensils, Clock, Globe, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";

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

    // Find restaurant data
    const currentRestaurant = restaurants.find(r => r._id === params.id);

    // Initial fetch if needed
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // If we already have the correct restaurant loaded, don't refetch
        if (currentRestaurant) return;

        const isOwner = user.roles.includes('owner');
        if (isOwner) {
            // Owner can fetch all
            fetchRestaurants();
        } else {
            // Staff should only fetch this specific restaurant
            // We should ideally check if params.id matches their workingAt ID
            // But for now, just fetch by ID
            fetchRestaurantById(params.id);
        }
    }, [user, isAuthenticated, fetchRestaurants, fetchRestaurantById, params.id, currentRestaurant]);

    if (!currentRestaurant) {
        return <div className="p-8">Loading restaurant data...</div>;
    }

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

            {/* KPIs - Using Real Data where applicable, Mock for others */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Sales" value="₹0" sub="No data yet" trend="" icon={DollarSign} />
                <KPICard title="Total Tables" value={currentRestaurant.tables?.length || 0} sub="Capacity" trend="" icon={Utensils} />
                <KPICard title="Pending Orders" value="0" sub="Live updates" trend="" icon={Clock} />
                <KPICard title="Online Status" value={currentRestaurant.isActive ? "Active" : "Inactive"} sub="Store visibility" trend="" icon={Globe} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartMock />
                <PopularDishesMock />
            </div>

            {/* Recent Orders Table */}
            <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold">Live Orders (Mock)</h3>
                    <button className="text-sm text-sunset font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Order ID</th>
                                <th className="px-6 py-3">Table</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {/* Mock Data */}
                            {[
                                { id: "#2045", table: "T-12", items: "Pizza, Coke...", amt: "₹550", status: "Cooking" },
                                { id: "#2044", table: "T-04", items: "Wings, Salad", amt: "₹890", status: "Ready" },
                            ].map((row) => (
                                <tr key={row.id} className="hover:bg-secondary/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{row.id}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{row.table}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{row.items}</td>
                                    <td className="px-6 py-4 font-bold">{row.amt}</td>
                                    <td className="px-6 py-4">
                                        <span className={
                                            row.status === 'Cooking' ? 'text-orange-600 dark:text-orange-400 font-semibold' :
                                                row.status === 'Ready' ? 'text-green-600 dark:text-green-400 font-semibold' :
                                                    'text-muted-foreground font-semibold'
                                        }>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
