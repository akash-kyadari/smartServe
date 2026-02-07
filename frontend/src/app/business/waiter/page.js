"use client";

import React, { useEffect } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ClipboardList, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import RoleGuard from "@/components/auth/RoleGuard";

function WaiterPOSPageContent() {
    const { fetchRestaurantById, restaurants, isLoading } = useRestaurantStore();
    const { user } = useAuthStore();

    const restaurantId = user?.workingAt?.[0]?.restaurantId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // Mock tables if not available - Replace with real data from API
    const tables = currentRestaurant?.tables || [
        { id: 1, number: 'T1', status: 'occupied', capacity: 4 },
        { id: 2, number: 'T2', status: 'free', capacity: 2 },
        { id: 3, number: 'T3', status: 'free', capacity: 4 },
        { id: 4, number: 'T4', status: 'reserved', capacity: 6 },
        { id: 5, number: 'T5', status: 'free', capacity: 2 },
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
        <div className="flex flex-col h-screen bg-secondary/10 overflow-hidden">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ClipboardList className="text-purple-600" />
                        POS Terminal
                    </h1>
                    <p className="text-xs text-muted-foreground">Waiter: {user?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> System Active
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-foreground">Floor Plan / Tables</h2>
                        <div className="flex gap-2 text-xs font-medium">
                            <span className="px-2 py-1 bg-card border border-border rounded flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Free
                            </span>
                            <span className="px-2 py-1 bg-card border border-border rounded flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Occupied
                            </span>
                            <span className="px-2 py-1 bg-card border border-border rounded flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Reserved
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {tables.map((table) => (
                            <motion.div
                                key={table.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative p-6 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center aspect-square shadow-sm
                                    ${table.status === 'free' ? 'bg-card border-green-500/50 hover:border-green-500' : ''}
                                    ${table.status === 'occupied' ? 'bg-red-50 dark:bg-red-900/10 border-red-500/50 hover:border-red-500' : ''}
                                    ${table.status === 'reserved' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500/50 hover:border-yellow-500' : ''}
                                `}
                            >
                                <span className={`text-2xl font-bold ${table.status === 'free' ? 'text-green-600' :
                                        table.status === 'occupied' ? 'text-red-500' : 'text-yellow-600'
                                    }`}>
                                    {table.number}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">{table.capacity} Seats</span>
                            </motion.div>
                        ))}
                        {/* Add Table Button Placeholder */}
                        <div className="border-2 border-dashed border-border rounded-xl flex items-center justify-center aspect-square cursor-pointer hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <span className="text-sm font-medium">+ New Order</span>
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
