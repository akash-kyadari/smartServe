"use client";

import React, { useEffect } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ChefHat, Clock } from "lucide-react";
import { motion } from "framer-motion";
import RoleGuard from "@/components/auth/RoleGuard";

function KitchenPageContent() {
    const { fetchRestaurantById, restaurants, isLoading } = useRestaurantStore();
    const { user } = useAuthStore();

    const restaurantId = user?.workingAt?.[0]?.restaurantId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // Mock orders - Replace with real data from API
    const orders = [
        { id: 101, table: 'T4', items: ['Truffle Pizza', 'Coke'], status: 'cooking', elapsed: '5m' },
        { id: 102, table: 'T2', items: ['Spicy Wings'], status: 'new', elapsed: '1m' },
    ];

    useEffect(() => {
        if (user && restaurantId && !currentRestaurant) {
            fetchRestaurantById(restaurantId);
        }
    }, [user, restaurantId, currentRestaurant, fetchRestaurantById]);

    if (isLoading || !currentRestaurant) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-sunset" size={40} />
            </div>
        );
    }

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
                    <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                        <Clock size={12} /> Live Orders
                    </div>
                </div>
            </header>

            {/* Orders Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex gap-4 h-full">
                    {/* New Orders Column */}
                    <div className="min-w-[300px] flex-1 flex flex-col gap-4">
                        <h2 className="font-bold text-muted-foreground uppercase text-sm tracking-wider mb-2">New Orders ({orders.filter(o => o.status === 'new').length})</h2>
                        {orders.filter(o => o.status === 'new').map(order => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-blue-500"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg text-foreground">#{order.id}</span>
                                    <span className="text-sm font-bold bg-secondary px-2 py-1 rounded text-muted-foreground">{order.table}</span>
                                </div>
                                <div className="space-y-1 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="text-lg font-medium text-foreground">{item}</div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
                                    <span>{order.elapsed} ago</span>
                                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded font-bold transition-colors">Start Cooking</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Cooking Column */}
                    <div className="min-w-[300px] flex-1 flex flex-col gap-4">
                        <h2 className="font-bold text-muted-foreground uppercase text-sm tracking-wider mb-2">Cooking ({orders.filter(o => o.status === 'cooking').length})</h2>
                        {orders.filter(o => o.status === 'cooking').map(order => (
                            <motion.div
                                key={order.id}
                                layoutId={order.id}
                                className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-orange-500"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg text-foreground">#{order.id}</span>
                                    <span className="text-sm font-bold bg-secondary px-2 py-1 rounded text-muted-foreground">{order.table}</span>
                                </div>
                                <div className="space-y-1 mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="text-lg font-medium text-foreground">{item}</div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
                                    <span className="text-orange-500 font-bold flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Cooking...</span>
                                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold transition-colors">Done</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Ready Column - Placeholder */}
                    <div className="min-w-[300px] flex-1 flex flex-col gap-4 opacity-50">
                        <h2 className="font-bold text-muted-foreground uppercase text-sm tracking-wider mb-2">Done</h2>
                        <div className="border-2 border-dashed border-border rounded-xl p-8 flex items-center justify-center text-muted-foreground font-medium">
                            No orders ready
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function KitchenPage() {
    return (
        <RoleGuard allowedRoles={['kitchen', 'manager']} requireRestaurant={true}>
            <KitchenPageContent />
        </RoleGuard>
    );
}
