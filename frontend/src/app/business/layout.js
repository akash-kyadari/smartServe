"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import useRestaurantStore from "@/store/useRestaurantStore";
import BusinessNavbar from "@/components/business/BusinessNavbar";

export default function BusinessLayout({ children }) {
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const { restaurants, fetchRestaurants, isInitialized } = useRestaurantStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect if we have finished loading and the user is definitely not authenticated
        if (!authLoading && !isAuthenticated) {
            // router.push('/business');
        } else if (isAuthenticated && !isInitialized) {
            // Fetch restaurants globally for the business section if not already initialized
            fetchRestaurants();
        }
    }, [isAuthenticated, authLoading, isInitialized, fetchRestaurants]);

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
    // This assumes routes like /business/restros/[id]/...
    const isRestaurantContext = pathname.startsWith('/business/restros/');
    let currentRestaurant = null;

    if (isRestaurantContext) {
        // Extract ID from path
        const parts = pathname.split('/');
        // parts[0] = "", parts[1] = "business", parts[2] = "restros", parts[3] = "id"
        if (parts.length >= 4) {
            const restroId = parts[3];
            currentRestaurant = restaurants.find(r => r._id === restroId);
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
