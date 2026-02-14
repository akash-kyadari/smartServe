"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar, User, Clock, Utensils, ChevronLeft, ChevronRight } from "lucide-react";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import RoleGuard from "@/components/auth/RoleGuard";
import socketService from "@/services/socketService";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";

function RestaurantBookingsContent() {
    const { id: restaurantId } = useParams();
    const { user } = useAuthStore();
    const { dashboardData, setDashboardData } = useRestaurantStore();

    // Initialize from store if available
    const storedBookings = dashboardData[restaurantId]?.bookings || {};

    // State
    const [bookings, setBookings] = useState(storedBookings.data || []);
    const [filterDate, setFilterDate] = useState(storedBookings.filters?.date || format(new Date(), "yyyy-MM-dd"));

    // Pagination State
    const [page, setPage] = useState(storedBookings.filters?.page || 1);
    const [totalPages, setTotalPages] = useState(storedBookings.pagination?.pages || 1);
    const [totalBookings, setTotalBookings] = useState(storedBookings.pagination?.total || 0);

    // Loading is true only if we have NO data to show
    const [isLoading, setIsLoading] = useState(!storedBookings.data);

    const LIMIT = 10;

    // Fetch Bookings when date or page changes
    useEffect(() => {
        if (!restaurantId) return;
        const controller = new AbortController();

        const fetchBookings = async (force = false) => {
            // Deduplication & Cache Check
            const currentFilters = { date: filterDate, page };
            const stored = useRestaurantStore.getState().dashboardData[restaurantId]?.bookings;

            // If !force, and we have stored data matching current filters, skip fetch
            if (!force && stored &&
                stored.filters?.date === filterDate &&
                stored.filters?.page === page &&
                stored.data) {

                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch bookings for the specific restaurant and date
                const query = new URLSearchParams({
                    restaurantId: restaurantId,
                    date: filterDate,
                    page: page,
                    limit: LIMIT
                });

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings?${query.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include',
                    signal: controller.signal
                });

                const data = await response.json();

                if (data.success) {
                    setBookings(data.bookings);
                    if (data.pagination) {
                        setTotalPages(data.pagination.pages);
                        setTotalBookings(data.pagination.total);

                        // Update cache
                        setDashboardData(restaurantId, {
                            bookings: {
                                data: data.bookings,
                                pagination: { pages: data.pagination.pages, total: data.pagination.total },
                                filters: currentFilters
                            }
                        });
                    }
                } else {
                    toast.error(data.message || "Failed to fetch bookings");
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                console.error("Error fetching bookings:", error);
                toast.error("Error loading bookings");
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        fetchBookings();

        // Socket.io Connection for Real-time Updates
        const socket = socketService.connect();

        if (user) {
            socketService.joinStaffRoom(restaurantId, user._id);
        }

        const handleNewBooking = (data) => {
            if (data.date === filterDate) {
                toast.success(`New booking received for ${data.startTime}`);
                // Refresh to get correct pagination order
                fetchBookings(true);
            }
        };

        const handleCancelledBooking = (data) => {
            if (data.date === filterDate) {
                toast.success(`Booking cancelled for ${data.startTime}`);
                setBookings(prev => prev.map(b =>
                    b._id === data.bookingId ? { ...b, status: 'cancelled' } : b
                ));
            }
        };

        // Listen for events
        socketService.onBookingCreated(handleNewBooking);
        socketService.onBookingCancelled(handleCancelledBooking);

        return () => {
            controller.abort();
            socketService.offBookingCreated(handleNewBooking);
            socketService.offBookingCancelled(handleCancelledBooking);
        };

    }, [restaurantId, filterDate, page, user]);

    // Handlers
    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
        setPage(1); // Reset to first page
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    // Computed
    // Note: Bookings are already sorted by backend
    const activeBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="text-sunset" />
                        Bookings Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time booking updates</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Date Picker */}
                    <input
                        type="date"
                        value={filterDate}
                        onChange={handleDateChange}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm text-gray-500">Total Bookings (Day)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBookings}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-500">Confirmed (Page)</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeBookingsCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-sm text-gray-500">Cancelled (Page)</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bookings.filter(b => b.status === 'cancelled').length}</p>
                </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Bookings for {format(new Date(filterDate), "MMMM d, yyyy")}
                    </h3>
                    {isLoading && <Loader2 className="animate-spin text-gray-400" size={18} />}
                </div>

                <div className="flex-1">
                    {!isLoading && bookings.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                            <Calendar size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-700" />
                            <p>No bookings found for this date.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {bookings.map((booking) => (
                                <div key={booking._id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 text-primary p-3 rounded-lg text-center min-w-[80px]">
                                                <div className="text-lg font-bold">{booking.startTime}</div>
                                                <div className="text-xs uppercase opacity-70">To {booking.endTime}</div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">Table {booking.tableNumber || '?'}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                                                        }`}>
                                                        {booking.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1"><User size={14} /> {booking.guestCount} Guests</span>
                                                    <span className="flex items-center gap-1"><Utensils size={14} /> Table {booking.tableNumber}</span>
                                                </div>
                                                {booking.notes && (
                                                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded inline-block mt-2">
                                                        Note: {booking.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 mb-1">Booked by User #{booking.userId.toString().slice(-4)}</div>
                                            {booking.status !== 'cancelled' && (
                                                <div className="text-xs text-gray-400">ID: {booking._id.slice(-6)}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RestaurantBookingsPage() {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']}>
            <RestaurantBookingsContent />
        </RoleGuard>
    );
}
