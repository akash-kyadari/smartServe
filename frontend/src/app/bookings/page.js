"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, MapPin, Clock, X, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import useAuthStore from "@/store/useAuthStore";
import useBookingsStore from "@/store/useBookingsStore";
import { useRouter } from "next/navigation";
import socketService from "@/services/socketService";

export default function BookingsPage() {
    const [cancellingId, setCancellingId] = useState(null);
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const { bookings, isLoading, fetchBookings, cancelBooking: cancelBookingStore, updateBookingStatus } = useBookingsStore();
    const router = useRouter();

    useEffect(() => {
        document.title = "My Bookings | Smart Serve";
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            // Fetch bookings (will use cache if available)
            fetchBookings();
        }
    }, [isAuthenticated, fetchBookings]);

    // Socket.IO connection for real-time booking updates
    useEffect(() => {
        if (!isAuthenticated || bookings.length === 0) return;

        // Connect to socket
        socketService.connect();

        // Join rooms for all restaurants the user has bookings with
        const restaurantIds = [...new Set(bookings.map(b => b.restaurantId?._id).filter(Boolean))];
        restaurantIds.forEach(restId => {
            socketService.joinRestaurantRoom(restId);
        });

        // Listen for booking cancellations
        const handleBookingCancelled = (data) => {
            const { bookingId } = data;
            // Update store to update booking status instead of full refresh
            updateBookingStatus(bookingId, 'cancelled');
        };

        socketService.onBookingCancelled(handleBookingCancelled);

        return () => {
            socketService.offBookingCancelled(handleBookingCancelled);
        };
    }, [isAuthenticated, bookings, fetchBookings]);

    // Group bookings by restaurant, date, and time
    const groupedBookings = bookings.reduce((acc, booking) => {
        const key = `${booking.restaurantId?._id}-${booking.date}-${booking.startTime}-${booking.status}`;
        if (!acc[key]) {
            acc[key] = {
                ...booking,
                tables: [booking.tableNumber || booking.tableId] // Prefer table number
            };
        } else {
            acc[key].tables.push(booking.tableNumber || booking.tableId);
        }
        return acc;
    }, {});

    const groupedBookingsArray = Object.values(groupedBookings);

    const cancelBooking = async (id) => {
        if (!confirm("Cancel this reservation?")) return;

        setCancellingId(id);
        try {
            await cancelBookingStore(id);
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert(error.message || "Failed to cancel");
        } finally {
            setCancellingId(null);
        }
    };

    const formatTime = (time) => {
        const [hour, minute] = time.split(':');
        const h = parseInt(hour);
        if (h === 0) return '12:00 AM';
        if (h < 12) return `${h}:${minute || '00'} AM`;
        if (h === 12) return `12:${minute || '00'} PM`;
        return `${h - 12}:${minute || '00'} PM`;
    };

    const isPastBooking = (date, time) => {
        const bookingDateTime = new Date(`${date}T${time}`);
        return bookingDateTime < new Date();
    };

    if (authLoading || (isLoading && bookings.length === 0)) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
            </>
        );
    }

    const upcomingBookings = groupedBookingsArray.filter(b => !isPastBooking(b.date, b.startTime) && b.status === 'confirmed');
    const pastBookings = groupedBookingsArray.filter(b => isPastBooking(b.date, b.startTime) || b.status !== 'confirmed');

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your reservations</p>
                    </div>

                    {bookings.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Start exploring restaurants</p>
                            <a
                                href="/restaurants"
                                className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                            >
                                Browse Restaurants
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Upcoming */}
                            {upcomingBookings.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming</h2>
                                    <div className="space-y-4">
                                        {upcomingBookings.map((booking) => (
                                            <div
                                                key={booking._id}
                                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                                    {booking.restaurantId?.name || "Restaurant"}
                                                                </h3>
                                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                                                    <MapPin className="h-4 w-4" />
                                                                    <span>{booking.restaurantId?.address?.city || "Location"}</span>
                                                                </div>
                                                            </div>
                                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                                                Confirmed
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Date</div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                                        {new Date(booking.date).toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                                <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">{formatTime(booking.startTime)}</div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                                <div>
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400">Tables</div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                                        {booking.tables.map(t => `#${t}`).join(', ')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {booking.notes && (
                                                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Special Requests</div>
                                                                <p className="text-sm text-amber-900 dark:text-amber-300">{booking.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <button
                                                            onClick={() => cancelBooking(booking._id)}
                                                            disabled={cancellingId === booking._id}
                                                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2 border border-red-200 dark:border-red-800"
                                                        >
                                                            {cancellingId === booking._id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <X className="h-4 w-4" />
                                                                    Cancel
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Past */}
                            {pastBookings.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4">Past</h2>
                                    <div className="space-y-3">
                                        {pastBookings.map((booking) => (
                                            <div
                                                key={booking._id}
                                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 opacity-75"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-medium text-gray-700 dark:text-gray-300">
                                                            {booking.restaurantId?.name || "Restaurant"}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{booking.restaurantId?.address?.city || "Location"}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${booking.status === 'cancelled'
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(booking.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(booking.startTime)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        Tables: {booking.tables.map(t => `#${t}`).join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
