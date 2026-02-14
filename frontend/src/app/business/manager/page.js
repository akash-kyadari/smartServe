"use client";

import React, { useEffect } from "react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, Store, Users, ClipboardList, ChefHat, BarChart3 } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/auth/RoleGuard";

function ManagerDashboardContent() {
    const { fetchRestaurantById, restaurants, isLoading } = useRestaurantStore();
    const { user } = useAuthStore();

    // Get restaurant ID from user's workingAt
    const restaurantId = user?.workingAt?.[0]?.restaurantId;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    useEffect(() => {
        document.title = "Manager Dashboard | Smart Serve";
    }, []);

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

    const QuickLink = ({ href, icon: Icon, title, desc, color }) => (
        <Link href={href} className="block group">
            <div className="h-full p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                    <Icon size={80} />
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-10`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
        </Link>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Store className="text-sunset" />
                    Manager Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                    Managing <span className="font-semibold text-foreground">{currentRestaurant.name}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuickLink
                    href="/business/kitchen"
                    icon={ChefHat}
                    title="Kitchen Display"
                    desc="Monitor and manage kitchen orders in real-time."
                    color="bg-red-500 text-red-600"
                />
                <QuickLink
                    href="/business/waiter"
                    icon={ClipboardList}
                    title="POS Terminal"
                    desc="Access point of sale and table management."
                    color="bg-green-500 text-green-600"
                />
                <QuickLink
                    href={`/business/manager/staff`}
                    icon={Users}
                    title="Staff Management"
                    desc="View staff schedules and assignments."
                    color="bg-blue-500 text-blue-600"
                />
                <QuickLink
                    href={`/business/manager/analytics`}
                    icon={BarChart3}
                    title="Analytics"
                    desc="View sales reports and performance metrics."
                    color="bg-purple-500 text-purple-600"
                />
            </div>

            <div className="mt-8 p-6 bg-card border border-border rounded-xl">
                <h2 className="text-lg font-bold text-foreground mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{currentRestaurant.tables?.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Tables</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-sm text-muted-foreground">Active Orders</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-sm text-muted-foreground">Staff on Duty</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {currentRestaurant.isActive ? 'Open' : 'Closed'}
                        </p>
                        <p className="text-sm text-muted-foreground">Status</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> As a manager, you have access to operational tools like Kitchen Display and POS Terminal.
                    For menu and settings changes, please contact the restaurant owner.
                </p>
            </div>
        </div>
    );
}

export default function ManagerDashboard() {
    return (
        <RoleGuard allowedRoles={['manager']} requireRestaurant={true}>
            <ManagerDashboardContent />
        </RoleGuard>
    );
}
