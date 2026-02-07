"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import useRestaurantStore from "@/store/useRestaurantStore";
import BusinessNavbar from "@/components/business/BusinessNavbar";

export default function BusinessLayout({ children }) {
    const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
    const { restaurants, fetchRestaurants, fetchRestaurantById, isInitialized } = useRestaurantStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only fetch if authenticated and not initialized
        if (!authLoading && isAuthenticated && !isInitialized && user) {
            const isOwner = user.roles.includes('owner');
            if (isOwner) {
                fetchRestaurants();
            } else {
                // For staff, fetch only their assigned restaurant
                const work = user.workingAt?.[0];
                if (work?.restaurantId) {
                    fetchRestaurantById(work.restaurantId);
                }
            }
        }
    }, [isAuthenticated, authLoading, isInitialized, user, fetchRestaurants, fetchRestaurantById]);

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-sunset border-t-transparent"></div>
                    <p className="text-muted-foreground animate-pulse">Loading workspace...</p>
                </div>
            </div>
        );
    }

    // If usage of this layout is strictly for authenticated views, then return null.
    // However, /business/page.js handles unauthenticated state by showing a landing page.
    // So we should allow rendering children if we are on /business even if not authenticated.
    // BUT, if we are on a protected route like /business/restros/..., we should block or the page itself will block.
    // Given the previous code just returned null, let's relax this.

    // Actually, BusinessHome handles !isAuthenticated. So we should just render children.
    // The useEffect above handles redirection if needed (currently commented out by user).

    // Removing the strict return null so BusinessHome can render.
    // if (!isAuthenticated) return null;

    // Helper to determine if we are in a specific restaurant context
    // Determine current restaurant for Navbar context
    let currentRestaurant = null;

    // 1. Check for Owner Path: /business/owner/restros/[id]
    if (pathname.includes('/business/owner/restros/')) {
        const parts = pathname.split('/business/owner/restros/');
        if (parts.length > 1) {
            const restroId = parts[1].split('/')[0];
            currentRestaurant = restaurants.find(r => r._id === restroId);
        }
    }
    // 2. Check for Staff Roles (if on their dashboard pages)
    else if (user && (pathname.includes('/business/manager') || pathname.includes('/business/kitchen') || pathname.includes('/business/waiter'))) {
        // Use the assigned restaurant from user profile
        const work = user.workingAt?.[0];
        if (work?.restaurantId) {
            currentRestaurant = restaurants.find(r => r._id === work.restaurantId);
        }
    }

    return (
        <div className="min-h-screen font-sans bg-background transition-colors duration-300 flex flex-col">
            <BusinessNavbar currentRestaurant={currentRestaurant} />

            {/* Main Content Area */}
            <main className="flex-1 bg-secondary/10">
                {children}
            </main>
        </div>
    );
}
