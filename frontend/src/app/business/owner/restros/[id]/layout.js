"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import useRestaurantStore from "@/store/useRestaurantStore";
import RoleGuard from "@/components/auth/RoleGuard";
import { Loader2 } from "lucide-react";
import { getSocket } from "@/lib/socket";

function RestaurantLayoutContent({ children }) {
    const params = useParams();
    const { user } = useAuthStore();
    const {
        restaurants,
        fetchRestaurantById,
        isLoading,
        setDashboardData,
        dashboardData,
        setStaffActiveStatus,
        updateTableStatus
    } = useRestaurantStore();

    const restaurantId = params.id;
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // Prevent double fetch in StrictMode
    const hasFetched = React.useRef(false);

    // Initial Fetch
    useEffect(() => {
        if (!user || !restaurantId) return;

        // If we already have the restaurant in store, no need to fetch
        if (currentRestaurant) return;

        // If we already initiated a fetch in this mount life-cycle, skip
        if (hasFetched.current) return;

        hasFetched.current = true;
        fetchRestaurantById(restaurantId).catch(() => {
            hasFetched.current = false; // Reset on failure so we can try again
        });

    }, [user, restaurantId, currentRestaurant, fetchRestaurantById]);

    // Persistent Socket Connection
    useEffect(() => {
        if (!restaurantId || !user) return;

        const socket = getSocket();
        socket.emit("join_staff_room", { restaurantId, userId: user._id });

        const handleNewOrder = (newOrder) => {
            const currentData = useRestaurantStore.getState().dashboardData[restaurantId] || {};
            const currentOrders = currentData.activeOrders || [];

            if (currentOrders.find(o => o._id === newOrder._id)) return;

            const updated = [newOrder, ...currentOrders];
            setDashboardData(restaurantId, { activeOrders: updated });
        };

        const handleOrderUpdate = (updatedOrder) => {
            const currentData = useRestaurantStore.getState().dashboardData[restaurantId] || {};
            const currentOrders = currentData.activeOrders || [];
            const exists = currentOrders.find(o => o._id === updatedOrder._id);

            let updated;
            if (exists) {
                updated = currentOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o);
            } else {
                updated = [updatedOrder, ...currentOrders];
            }
            setDashboardData(restaurantId, { activeOrders: updated });
        };

        const handleTableUpdate = (data) => {
            // "table_update" sends { tableId, isOccupied: true, currentOrderId: '...' }
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, data);
            } else {
                // Fallback if no specific data
                fetchRestaurantById(restaurantId, true);
            }
        };

        const handleTableFreed = (data) => {
            // "table_freed" sends { tableId }
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, {
                    isOccupied: false,
                    currentOrderId: null,
                    assignedWaiterId: null,
                    requestService: false,
                    requestBill: false
                });
            } else {
                fetchRestaurantById(restaurantId, true);
            }
        };

        const handleTableServiceUpdate = (data) => {
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, { requestService: data.requestService });
            } else {
                fetchRestaurantById(restaurantId, true);
            }
        };

        const handleTableBillUpdate = (data) => {
            if (data && data.tableId) {
                updateTableStatus(restaurantId, data.tableId, { requestBill: data.requestBill });
            } else {
                fetchRestaurantById(restaurantId, true);
            }
        };

        const handleStaffUpdate = ({ staffId, isActive }) => {
            if (staffId) setStaffActiveStatus(restaurantId, staffId, isActive);
        };

        socket.on("new_order", handleNewOrder);
        socket.on("order_update", handleOrderUpdate);

        // Table Updates
        socket.on("table_update", handleTableUpdate);
        socket.on("table_freed", handleTableFreed);
        socket.on("table_service_update", handleTableServiceUpdate);
        socket.on("table_bill_update", handleTableBillUpdate);

        socket.on("staff_update", handleStaffUpdate);

        return () => {
            socket.off("new_order", handleNewOrder);
            socket.off("order_update", handleOrderUpdate);
            socket.off("table_update", handleTableUpdate);
            socket.off("table_freed", handleTableFreed);
            socket.off("table_service_update", handleTableServiceUpdate);
            socket.off("table_bill_update", handleTableBillUpdate);
            socket.off("staff_update", handleStaffUpdate);
        };
    }, [restaurantId, user, setDashboardData, fetchRestaurantById, setStaffActiveStatus, updateTableStatus]);

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
