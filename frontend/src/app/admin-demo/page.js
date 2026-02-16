"use client";

import React, { useState } from "react";
import { DollarSign, Utensils, Clock, Globe, ArrowUpRight, MoreHorizontal, AlertTriangle, Star } from "lucide-react";
import { motion } from "framer-motion";

// --- Mock Data ---
const STAFF_MOCK = [
    { _id: 1, name: "Alex Johnson", role: "waiter", isActive: true },
    { _id: 2, name: "Sarah Smith", role: "kitchen", isActive: true },
    { _id: 3, name: "Mike Brown", role: "waiter", isActive: false },
    { _id: 4, name: "Emily Davis", role: "manager", isActive: true },
];

const REVIEWS_MOCK = [
    { _id: 1, customerName: "John Doe", rating: 5, comment: "Amazing food and service!", createdAt: new Date().toISOString() },
    { _id: 2, customerName: "Jane Smith", rating: 4, comment: "Good, but music was loud.", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: 3, customerName: "Bob Wilson", rating: 5, comment: "Best pizza in town!", createdAt: new Date(Date.now() - 172800000).toISOString() },
];

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
            <span className="text-green-600 dark:text-green-400 font-bold flex items-center bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={12} className="mr-1" /> {trend}
            </span>
            <span className="text-muted-foreground">{sub}</span>
        </div>
    </div>
);

const RevenueChart = React.memo(() => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border lg:col-span-2 h-full">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Revenue Overview (Last 7 Days)</h3>
        </div>
        <div className="h-64 flex items-end gap-4 overflow-hidden">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-gray-900 to-gray-600 dark:from-sunset dark:to-orange-600 rounded-t-lg relative group opacity-90 hover:opacity-100 transition-opacity min-h-[4px]"
                >
                    <div className="absolute -top-8 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-foreground">
                        ₹{h}k
                    </div>
                </motion.div>
            ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-muted-foreground font-medium uppercase">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
    </div>
));

const PopularDishes = React.memo(() => (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border">
            <h3 className="font-bold flex items-center justify-between">
                Popular Dishes
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">30 Days</span>
            </h3>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-[300px] max-h-[400px]">
            {[
                { name: "Truffle Pizza", sales: "84%", count: 124, color: "bg-sunset" },
                { name: "Spicy Wings", sales: "62%", count: 98, color: "bg-orange-400" },
                { name: "Burrata Salad", sales: "45%", count: 76, color: "bg-yellow-400" },
            ].map((d) => (
                <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-muted-foreground">{d.name}</span>
                        <span className="font-bold text-foreground">{d.sales} ({d.count})</span>
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
));

const StaffOverview = React.memo(() => (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border">
            <h3 className="font-bold flex items-center justify-between">
                Staff Status
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    3 Online
                </span>
            </h3>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-[300px] max-h-[400px]">
            {STAFF_MOCK.map((s) => (
                <div key={s._id} className={`flex items-center justify-between ${!s.isActive && 'opacity-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${s.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-muted-foreground'}`}>
                            {s.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold leading-none">{s.name}</p>
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
        </div>
    </div>
));

const LowStockAlert = React.memo(() => (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-xl shadow-sm mb-6">
        <h3 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} /> Low Stock Alert (2)
        </h3>
        <div className="flex flex-wrap gap-2">
            {[
                { name: "Tomatoes", stock: 3 },
                { name: "Diet Coke", stock: 5 }
            ].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white dark:bg-black/20 px-2 py-1 rounded text-xs border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300">
                    <span className="font-medium max-w-[100px] truncate">{item.name}</span>
                    <span className="font-bold bg-red-100 dark:bg-red-900/50 px-1.5 rounded-sm">{item.stock}</span>
                </span>
            ))}
        </div>
    </div>
));

const RatingsReviews = React.memo(() => (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="font-bold">Ratings & Reviews</h3>
            <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                <Star className="text-yellow-500 fill-yellow-500" size={16} />
                <span className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">4.8</span>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            <div className="divide-y divide-border">
                {REVIEWS_MOCK.map((review) => (
                    <div key={review._id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                    {review.customerName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{review.customerName}</p>
                                    <p className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
));

export default function AdminPage() {
    return (
        <div className="space-y-8 min-h-screen bg-background text-foreground p-6 sm:p-8 font-sans">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-foreground">Owner Dashboard</h2>
                <p className="text-muted-foreground text-sm">Welcome back, Owner. Here's what's happening today.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Revenue" value="₹124,500" sub="vs yesterday" trend="+12%" icon={DollarSign} />
                <KPICard title="Active Tables" value="18/24" sub="right now" trend="+4" icon={Utensils} />
                <KPICard title="Pending Orders" value="7" sub="needs attention" trend="-2" icon={Clock} />
                <KPICard title="Remote Bookings" value="32" sub="for tonight" trend="+8" icon={Globe} />
            </div>

            {/* Charts & Staff & Ratings - Matching Real Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Row 1 */}
                <RevenueChart />

                <div className="flex flex-col h-full">
                    <LowStockAlert />
                    <StaffOverview />
                </div>

                {/* Row 2 */}
                <div className="lg:col-span-2 h-full">
                    <RatingsReviews />
                </div>

                <div className="h-full">
                    <PopularDishes />
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold">Live Orders</h3>
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
                            {[
                                { id: "#2045", table: "T-12", items: "Pizza, Coke...", amt: "₹550", status: "Cooking" },
                                { id: "#2044", table: "T-04", items: "Wings, Salad", amt: "₹890", status: "Ready" },
                                { id: "#2043", table: "Remote", items: "Pre-order Set A", amt: "₹2,400", status: "Pending" },
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
