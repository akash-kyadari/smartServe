"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import useRestaurantStore from "@/store/useRestaurantStore";
import RoleGuard from "@/components/auth/RoleGuard";
import { Loader2 } from "lucide-react";

function RestaurantLayoutContent({ children }) {
    const params = useParams();
    const { user } = useAuthStore();
    const { restaurants, fetchRestaurantById, isLoading } = useRestaurantStore();

    const restaurantId = params.id;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    useEffect(() => {
        if (!user || !restaurantId) return;

        // Since RoleGuard ensures only owners reach here, just fetch restaurant data
        if (!currentRestaurant) {
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
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Content (Scrollable) */}
            <main className="flex-1 h-full overflow-y-auto bg-secondary/10 p-4 md:p-8">
                <div className="max-w-7xl mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function RestaurantSpecificLayout({ children }) {
    return (
        <RoleGuard allowedRoles={['owner']}>
            <RestaurantLayoutContent>{children}</RestaurantLayoutContent>
        </RoleGuard>
    );
}
