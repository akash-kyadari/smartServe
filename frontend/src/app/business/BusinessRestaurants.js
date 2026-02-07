"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function BusinessRestaurants() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.roles.includes('owner')) {
                router.replace('/business/owner');
            } else if (user.roles.includes('manager')) {
                router.replace('/business/manager');
            } else if (user.roles.includes('kitchen')) {
                router.replace('/business/kitchen');
            } else if (user.roles.includes('waiter')) {
                router.replace('/business/waiter');
            } else {
                // Fallback
                router.replace('/business/owner');
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={40} />
        </div>
    );
}
