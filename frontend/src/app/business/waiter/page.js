"use client";

import React, { useEffect } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ClipboardList, CheckCircle, Bell, Clock, ChefHat, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import RoleGuard from "@/components/auth/RoleGuard";

function WaiterPOSPageContent() {
    const { fetchRestaurantById, restaurants, isLoading } = useRestaurantStore();
    const { user } = useAuthStore();

    const restaurantId = user?.workingAt?.[0]?.restaurantId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    useEffect(() => {
        if (user && restaurantId && !isLoading && !currentRestaurant) {
            fetchRestaurantById(restaurantId);
        }
    }, [user, restaurantId, currentRestaurant, fetchRestaurantById, isLoading]);

    // Normalize tables data
    const tables = currentRestaurant?.tables?.map(t => ({
        id: t._id,
        number: `T${t.tableNumber}`,
        status: t.isOccupied ? 'occupied' : 'free',
        capacity: t.capacity,
        isOccupied: t.isOccupied
    })) || [
            { id: "m1", number: 'T1', status: 'occupied', capacity: 4, isOccupied: true },
            { id: "m2", number: 'T2', status: 'free', capacity: 2, isOccupied: false },
            { id: "m3", number: 'T3', status: 'free', capacity: 4, isOccupied: false },
            { id: "m4", number: 'T4', status: 'reserved', capacity: 6, isOccupied: false },
            { id: "m5", number: 'T5', status: 'free', capacity: 2, isOccupied: false },
        ];

    const myTasks = [
        { id: 1, type: "order_ready", title: "Order Ready - T3", time: "2m ago", desc: "Pasta Carbonara, Coke", icon: <ChefHat size={16} /> },
        { id: 2, type: "new_customer", title: "New Customer - T5", time: "Just now", desc: "Seated, waiting for menu", icon: <Bell size={16} /> },
        { id: 3, type: "payment", title: "Payment Pending - T1", time: "5m ago", desc: "Bill requested: $45.50", icon: <AlertCircle size={16} /> },
    ];

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-sunset" size={40} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-secondary/10 overflow-hidden">
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
                    <div className="flex items-center gap-2 text-xs font-medium bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Online
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-8">
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
                        <div className="bg-card border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reserved</span>
                            <div className="text-2xl font-bold text-yellow-600 mt-1">
                                {tables.filter(t => t.status === 'reserved').length}
                            </div>
                        </div>
                        <div className="bg-card border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total capacity</span>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                {tables.reduce((acc, t) => acc + (t.capacity || 0), 0)}
                            </div>
                        </div>
                    </div>

                    {/* Waiter Updates & Work */}
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                            My Updates & Work
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myTasks.map((task) => (
                                <div key={task.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start gap-4 hover:border-purple-500/50 transition-colors">
                                    <div className={`p-3 rounded-full ${task.type === "order_ready" ? "bg-green-100 text-green-600 dark:bg-green-900/20" :
                                        task.type === "new_customer" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" :
                                            "bg-orange-100 text-orange-600 dark:bg-orange-900/20"
                                        }`}>
                                        {task.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-sm text-foreground">{task.title}</h3>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full">
                                                <Clock size={10} /> {task.time}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{task.desc}</p>
                                        <button className="text-xs font-medium text-purple-600 mt-2 hover:underline">Mark as Done</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-sunset rounded-full"></div>
                            Floor Plan
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {tables.map((table) => (
                                <motion.div
                                    key={table.id || table.number}
                                    whileHover={{ y: -5, shadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                    className={`
                                        relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300
                                        ${table.status === 'free'
                                            ? 'bg-card border-border hover:border-green-400'
                                            : table.status === 'occupied'
                                                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                : 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'}
                                    `}
                                >
                                    <div className="p-5 flex flex-col items-center justify-center gap-4 relative z-10">
                                        {/* Status Badge */}
                                        <div className={`
                                            absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wide
                                            ${table.status === 'free' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                table.status === 'occupied' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                                        `}>
                                            {table.status}
                                        </div>

                                        <div className={`
                                            w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm transition-transform group-hover:scale-110
                                            ${table.status === 'free' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                                                table.status === 'occupied' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                                                    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'}
                                        `}>
                                            {table.number}
                                        </div>

                                        <div className="text-center space-y-1">
                                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                                <CheckCircle size={12} className={table.status === 'free' ? 'text-green-500' : 'text-muted-foreground'} />
                                                Capacity: <span className="font-semibold text-foreground">{table.capacity}</span>
                                            </div>
                                        </div>

                                        {/* Action Button (Visible on Hover) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileHover={{ opacity: 1, y: 0 }}
                                            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        >
                                            <button className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                {table.status === 'free' ? 'Take Order' : 'Manage'}
                                            </button>
                                        </motion.div>
                                    </div>

                                    {/* Bottom aesthetic line */}
                                    <div className={`h-1 w-full mt-auto ${table.status === 'free' ? 'bg-green-500' :
                                        table.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}></div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function WaiterPOSPage() {
    return (
        <RoleGuard allowedRoles={['waiter', 'manager']} requireRestaurant={true}>
            <WaiterPOSPageContent />
        </RoleGuard>
    );
}
