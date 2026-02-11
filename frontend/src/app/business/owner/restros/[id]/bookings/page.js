"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar, User, Clock, Utensils } from "lucide-react";
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

    // State
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

    // Fetch Bookings when date changes (restaurantId is fixed from URL)
    useEffect(() => {
        if (!restaurantId) return;

        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                // Fetch bookings for the specific restaurant and date
                const query = new URLSearchParams({
                    restaurantId: restaurantId,
                    date: filterDate
                });

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings?${query.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    setBookings(data.bookings);
                } else {
                    toast.error(data.message || "Failed to fetch bookings");
                }
            } catch (error) {
                console.error("Error fetching bookings:", error);
                toast.error("Error loading bookings");
            } finally {
                setIsLoading(false);
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
                setBookings(prev => {
                    if (prev.find(b => b._id === data.booking._id)) return prev;
                    return [...prev, data.booking].sort((a, b) => a.startTime.localeCompare(b.startTime));
                });
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
            socketService.offBookingCreated(handleNewBooking);
            socketService.offBookingCancelled(handleCancelledBooking);
        };

    }, [restaurantId, filterDate, user]);


    // Computed
    const sortedBookings = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
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
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeBookingsCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-sm text-gray-500">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bookings.filter(b => b.status === 'cancelled').length}</p>
                </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Bookings for {format(new Date(filterDate), "MMMM d, yyyy")}
                    </h3>
                    {isLoading && <Loader2 className="animate-spin text-gray-400" size={18} />}
                </div>

                {!isLoading && bookings.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-700" />
                        <p>No bookings found for this date.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {sortedBookings.map((booking) => (
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
