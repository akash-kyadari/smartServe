"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * RoleGuard - Production-grade authorization component
 * Protects routes based on user roles and authentication status
 * 
 * @param {Object} props
 * @param {Array<string>} props.allowedRoles - Array of roles allowed to access this route
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.redirectTo - Optional custom redirect path for unauthorized users
 * @param {boolean} props.requireRestaurant - Whether user must have a restaurant assigned
 */
export default function RoleGuard({
    allowedRoles = [],
    children,
    redirectTo = "/business",
    requireRestaurant = false
}) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Wait for auth check to complete
        if (isLoading) return;

        // Redirect if not authenticated
        if (!isAuthenticated || !user) {
            router.replace("/restro-login");
            return;
        }

        // Check if user has any of the allowed roles
        const hasAllowedRole = allowedRoles.length === 0 ||
            allowedRoles.some(role => user.roles?.includes(role));

        if (!hasAllowedRole) {
            // Redirect to appropriate page based on user's role
            if (user.roles?.includes('owner')) {
                router.replace('/business/owner');
            } else if (user.roles?.includes('manager')) {
                router.replace('/business/manager');
            } else if (user.roles?.includes('kitchen')) {
                router.replace('/business/kitchen');
            } else if (user.roles?.includes('waiter')) {
                router.replace('/business/waiter');
            } else {
                router.replace(redirectTo);
            }
            return;
        }

        // Check if restaurant assignment is required
        if (requireRestaurant) {
            const hasRestaurant = user.workingAt?.length > 0 || user.roles?.includes('owner');
            if (!hasRestaurant) {
                router.replace('/business');
                return;
            }
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, redirectTo, requireRestaurant, router]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-sunset" />
                    <p className="text-muted-foreground animate-pulse">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Show unauthorized state if checks fail
    if (!isAuthenticated || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <ShieldAlert className="h-16 w-16 text-red-500" />
                    <h2 className="text-2xl font-bold text-foreground">Authentication Required</h2>
                    <p className="text-muted-foreground">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    // Check role authorization
    const hasAllowedRole = allowedRoles.length === 0 ||
        allowedRoles.some(role => user.roles?.includes(role));

    if (!hasAllowedRole) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <ShieldAlert className="h-16 w-16 text-orange-500" />
                    <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground">
                        You don't have permission to access this page.
                        Required role: {allowedRoles.join(', ')}
                    </p>
                </div>
            </div>
        );
    }

    // Check restaurant requirement
    if (requireRestaurant) {
        const hasRestaurant = user.workingAt?.length > 0 || user.roles?.includes('owner');
        if (!hasRestaurant) {
            return (
                <div className="flex h-screen items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md">
                        <ShieldAlert className="h-16 w-16 text-yellow-500" />
                        <h2 className="text-2xl font-bold text-foreground">No Restaurant Assigned</h2>
                        <p className="text-muted-foreground">
                            You need to be assigned to a restaurant to access this page.
                        </p>
                    </div>
                </div>
            );
        }
    }

    // Render children if all checks pass
    return <>{children}</>;
}
