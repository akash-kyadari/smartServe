"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, MapPin, Star, Calendar, Clock, Users, X, Check, ChevronLeft, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import useBookingsStore from "@/store/useBookingsStore";
import useRestaurantsListStore from "@/store/useRestaurantsListStore";
import useAuthStore from "@/store/useAuthStore";
import socketService from "@/services/socketService";

const API_URL = (process.env.NEXT_PUBLIC_API_URL) + "/api";

const BookingModal = React.memo(({ restaurant, onClose }) => {
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState("today");
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedTables, setSelectedTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [bookedTables, setBookedTables] = useState([]);

    // Use bookings store
    const router = useRouter();
    const { createBooking } = useBookingsStore();

    // Use refs for form inputs that don't need to trigger re-renders
    const occasionRef = useRef("");
    const notesRef = useRef("");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Helper to format date as YYYY-MM-DD in LOCAL time
    const toLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const dateOptions = [
        { id: "today", label: "Today", date: toLocalDateString(today), display: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
        { id: "tomorrow", label: "Tomorrow", date: toLocalDateString(tomorrow), display: tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
    ];

    // Generate time slots and filter based on selected date
    const getAvailableTimeSlots = useMemo(() => {
        const allSlots = [];
        for (let hour = 9; hour <= 22; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            const display = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
            allSlots.push({ time, display });
        }

        // If today is selected, filter out past times
        if (selectedDate === "today") {
            const currentHour = new Date().getHours();
            return allSlots.filter(slot => {
                const slotHour = parseInt(slot.time.split(':')[0]);
                return slotHour > currentHour; // Only show future hours
            });
        }

        // For tomorrow, show all slots
        return allSlots;
    }, [selectedDate]);

    const [lockedTables, setLockedTables] = useState([]); // Tables locked by OTHERS
    const [timeLeft, setTimeLeft] = useState(60); // 60s timer for MY selection

    // Timer Logic
    useEffect(() => {
        let timer;
        if (selectedTables.length > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Time expired
                        clearInterval(timer);
                        handleTimeExpired();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimeLeft(60); // Reset when no tables selected
        }
        return () => clearInterval(timer);
    }, [selectedTables]);

    const handleTimeExpired = async () => {
        // Auto unlock all selected tables
        const dateObj = dateOptions.find(d => d.id === selectedDate);
        setError("Time expired! Your selection has been released.");
        setTimeout(() => setError(null), 3000);

        const tablesToUnlock = [...selectedTables];
        setSelectedTables([]); // Clear UI immediately

        // Server cleanup
        try {
            await Promise.all(tablesToUnlock.map(tableId =>
                axios.post(`${API_URL}/bookings/unlock`, {
                    restaurantId: restaurant._id,
                    tableId,
                    date: dateObj.date,
                    startTime: selectedTime
                }, { withCredentials: true })
            ));
        } catch (e) { console.error(e); }
    };

    const handleClose = async () => {
        if (selectedTables.length > 0 && selectedDate && selectedTime) {
            const dateObj = dateOptions.find(d => d.id === selectedDate);
            try {
                await Promise.all(selectedTables.map(tableId =>
                    axios.post(`${API_URL}/bookings/unlock`, {
                        restaurantId: restaurant._id,
                        tableId,
                        date: dateObj.date,
                        startTime: selectedTime
                    }, { withCredentials: true })
                ));
            } catch (e) { console.error("Unlock on close failed", e); }
        }
        onClose();
    };

    // Socket.IO connection for real-time updates
    useEffect(() => {
        // Connect to socket and join restaurant room
        socketService.connect();
        socketService.joinRestaurantRoom(restaurant._id);

        // Listen for table availability changes
        const handleTableUnavailable = (data) => {
            const { tableId, date, startTime } = data;
            const selectedDateObj = dateOptions.find(d => d.id === selectedDate);

            // If the unavailable table matches current selection, update booked tables
            if (selectedDateObj && date === selectedDateObj.date && startTime === selectedTime) {
                setBookedTables(prev => {
                    if (!prev.includes(tableId)) return [...prev, tableId];
                    return prev;
                });

                // Remove from selected tables if it was selected by ME
                // Note: If I am the one who locked it, I shouldn't remove it from my selection?
                // Actually, table:unavailable is for confirmed bookings usually.

                setSelectedTables(prev => {
                    if (prev.includes(tableId)) {
                        // Optimistic removal or double check?
                        // If I just booked it, I will be redirected.
                        return prev.filter(id => id !== tableId);
                    }
                    return prev;
                });
            }
        };

        const handleTableLocked = (data) => {
            const { tableId, date, startTime, lockedBy } = data; // lockedBy passed from backend
            const selectedDateObj = dateOptions.find(d => d.id === selectedDate);

            if (selectedDateObj && date === selectedDateObj.date && startTime === selectedTime) {
                // If NOT locked by me (we don't get user ID here easily to check "me",
                // but "lockedTables" is specifically for visualizing OTHERS' locks)
                // If I have it in "selectedTables", I assume I own the lock.
                // Ideally backend sends my userId back in "lockTable" response to confirm ownership,
                // or we check against known user ID.
                // Simple verification: If it's in my "selectedTables", ignore the lock event visually (or I see myself as locked?)
                // Actually, showing "Locked" for myself is confusing.
                // Frontend logic: Button is green (Selected) for me, Gray (Locked) for others.

                if (lockedBy && user && lockedBy === user._id) {
                    return; // Verify it is mine
                }

                setLockedTables(prev => {
                    if (!prev.includes(tableId)) return [...prev, tableId];
                    return prev;
                });
            }
        };

        const handleTableUnlocked = (data) => {
            const { tableId, date, startTime } = data;
            const selectedDateObj = dateOptions.find(d => d.id === selectedDate);

            if (selectedDateObj && date === selectedDateObj.date && startTime === selectedTime) {
                setLockedTables(prev => prev.filter(id => id !== tableId));
            }
        };

        const handleTableAvailable = (data) => {
            console.log("Socket: table:available event received:", data);
            const { tableId, date, startTime } = data;
            const selectedDateObj = dateOptions.find(d => d.id === selectedDate);

            if (selectedDateObj && date === selectedDateObj.date && startTime === selectedTime) {
                // Table became free (cancelled booking)
                console.log("Refreshing tables due to cancellation...");
                fetchBookedTables();
            }
        };

        socketService.onTableUnavailable(handleTableUnavailable);
        socketService.onTableLocked(handleTableLocked);
        socketService.onTableUnlocked(handleTableUnlocked);
        socketService.onTableAvailable(handleTableAvailable);

        return () => {
            socketService.offTableUnavailable(handleTableUnavailable);
            socketService.offTableLocked(handleTableLocked);
            socketService.offTableUnlocked(handleTableUnlocked);
            socketService.offTableAvailable(handleTableAvailable);
        };
    }, [restaurant._id, selectedDate, selectedTime, user]); // Added user dependency

    useEffect(() => {
        if (selectedDate && selectedTime) {
            // Reset timer when slot changes
            setTimeLeft(60);
            setSelectedTables([]);
            fetchBookedTables();
        } else {
            setBookedTables([]);
            setLockedTables([]);
        }
    }, [selectedDate, selectedTime]);

    const fetchBookedTables = async () => {
        try {
            const dateObj = dateOptions.find(d => d.id === selectedDate);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_URL}/bookings`, {
                params: {
                    restaurantId: restaurant._id,
                    date: dateObj.date,
                    startTime: selectedTime
                },
                withCredentials: true,
                headers
            });

            // "bookings" now includes both confirmed and locked tables
            // Filter out MY locks from "busy" list so I can still see them as selected
            const allBusy = response.data.bookings?.filter(b => {
                if (b.status === 'locked' && b.lockedBy === user?._id) return false;
                return true;
            }).map(b => b.tableId) || [];

            // Separate logic if we wanted, but for "disabled" state, merged list is fine
            // However, we want to distinguish "Booked" vs "Locked by someone else" vs "Selected by me"
            // For simplicity, let's treat all server-returned busy tables as "bookedTables" for disabling
            setBookedTables(allBusy);
            setLockedTables([]); // Reset local tracking as full fetch covers it
        } catch (err) {
            console.error("Error fetching booked tables:", err);
            setBookedTables([]);
        }
    };

    const toggleTable = async (tableId) => {
        if (bookedTables.includes(tableId) || lockedTables.includes(tableId)) return;

        const isSelected = selectedTables.includes(tableId);
        const dateObj = dateOptions.find(d => d.id === selectedDate);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        if (isSelected) {
            // DESELECT -> Unlock
            try {
                setSelectedTables(prev => prev.filter(id => id !== tableId));
                await axios.post(`${API_URL}/bookings/unlock`, {
                    restaurantId: restaurant._id,
                    tableId,
                    date: dateObj.date,
                    startTime: selectedTime
                }, { withCredentials: true, headers });
            } catch (err) {
                console.error("Unlock failed", err);
            }
        } else {
            // SELECT -> Lock
            try {
                // Optimistic update
                setSelectedTables(prev => [...prev, tableId]);

                await axios.post(`${API_URL}/bookings/lock`, {
                    restaurantId: restaurant._id,
                    tableId,
                    date: dateObj.date,
                    startTime: selectedTime
                }, { withCredentials: true, headers });
            } catch (err) {
                // Lock failed
                console.error("Lock failed", err);
                setSelectedTables(prev => prev.filter(id => id !== tableId)); // Revert

                if (err.response?.status === 409) {
                    alert("This table was just selected by someone else.");
                    setLockedTables(prev => [...prev, tableId]);
                } else if (err.response?.status === 401) {
                    alert("Please login to book a table.");
                    // Optional: Redirect to login
                } else {
                    alert("Failed to lock table. Please try again.");
                }
            }
        }
    };

    const getTotalCapacity = () => {
        return selectedTables.reduce((sum, tableId) => {
            const table = restaurant.tables.find(t => t._id === tableId);
            return sum + (table?.capacity || 0);
        }, 0);
    };

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime) {
            setError("Please select date and time");
            return;
        }
        if (selectedTables.length === 0) {
            setError("Please select at least one table");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dateObj = dateOptions.find(d => d.id === selectedDate);
            const bookingPromises = selectedTables.map(tableId => {
                const table = restaurant.tables.find(t => t._id === tableId);
                return createBooking({
                    restaurantId: restaurant._id,
                    tableId,
                    date: dateObj.date,
                    startTime: selectedTime,
                    guestCount: table?.capacity || 2,
                    notes: `${occasionRef.current ? `Occasion: ${occasionRef.current}. ` : ''}${notesRef.current}`
                });
            });

            await Promise.all(bookingPromises);
            setSuccess(true);
            setTimeout(() => {
                router.push('/bookings');
            }, 1000);
        } catch (err) {
            setError(err.message || "Failed to create booking");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Booking Confirmed!</h3>
                    <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="bg-indigo-600 text-white p-6 rounded-t-lg relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="text-2xl font-semibold">{restaurant.name}</h2>
                        <p className="text-indigo-100 text-sm mt-1">Reserve your table</p>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                <Info className="h-4 w-4 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
                            <div className="grid grid-cols-2 gap-3">
                                {dateOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSelectedDate(option.id);
                                            setSelectedTables([]);
                                        }}
                                        className={`p-4 rounded-lg border-2 transition-all ${selectedDate === option.id
                                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700/50'
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{option.display}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time */}
                        {selectedDate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Time</label>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                    {getAvailableTimeSlots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            onClick={() => {
                                                setSelectedTime(slot.time);
                                                setSelectedTables([]);
                                            }}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedTime === slot.time
                                                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                                }`}
                                        >
                                            {slot.display}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tables */}
                        {selectedDate && selectedTime && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Choose Tables
                                        {selectedTables.length > 0 && (
                                            <span className="ml-2 text-red-600 dark:text-red-400 font-bold">
                                                (Expires in 00:{timeLeft.toString().padStart(2, '0')})
                                            </span>
                                        )}
                                    </label>
                                    {selectedTables.length > 0 && (
                                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">
                                            {getTotalCapacity()} seats
                                        </span>
                                    )}
                                </div>

                                {/* Legend */}
                                <div className="flex gap-4 mb-3 text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded"></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-500 rounded"></div>
                                        <span>Selected</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                        <span>Booked/Busy</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {restaurant.tables.map((table) => {
                                        // A table is disabled if it's already booked (from server) OR temporary lock (socket)
                                        const isBooked = bookedTables.includes(table._id);
                                        const isLocked = lockedTables.includes(table._id);
                                        const isSelected = selectedTables.includes(table._id);

                                        // Treat locked same as booked for interaction purposes
                                        const isUnavailable = isBooked || isLocked;

                                        return (
                                            <button
                                                key={table._id}
                                                onClick={() => toggleTable(table._id)}
                                                disabled={isUnavailable}
                                                className={`relative p-4 rounded-lg border-2 transition-all ${isUnavailable
                                                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60'
                                                    : isSelected
                                                        ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white'
                                                        : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-600 text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-indigo-600" />
                                                    </div>
                                                )}
                                                {isUnavailable && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                                                        <X className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                                <div className="text-center">
                                                    <div className="text-lg font-bold">#{table.tableNumber}</div>
                                                    <div className="text-xs flex items-center justify-center gap-1 mt-1">
                                                        <Users className="h-3 w-3" />
                                                        {table.capacity}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Occasion & Notes */}
                        {selectedTables.length > 0 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Occasion (Optional)</label>
                                    <select
                                        ref={(el) => { if (el) occasionRef.current = el.value; }}
                                        defaultValue=""
                                        onChange={(e) => { occasionRef.current = e.target.value; }}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select occasion</option>
                                        <option value="Birthday">Birthday</option>
                                        <option value="Anniversary">Anniversary</option>
                                        <option value="Business">Business Meeting</option>
                                        <option value="Date">Date Night</option>
                                        <option value="Family">Family Gathering</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Special Requests</label>
                                    <textarea
                                        ref={(el) => { if (el) notesRef.current = el.value; }}
                                        defaultValue=""
                                        onChange={(e) => { notesRef.current = e.target.value; }}
                                        placeholder="Any special requirements..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedTables.length === 0}
                            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                'Confirm Reservation'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

BookingModal.displayName = 'BookingModal';

export default function RestaurantDetails() {
    const { id } = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("menu");
    const [showBooking, setShowBooking] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const searchInputRef = useRef(null);

    const { fetchRestaurantById } = useRestaurantsListStore();

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                // Use the store's fetch method which handles caching
                const data = await fetchRestaurantById(id);
                setRestaurant(data);
                if (data) document.title = `${data.name} | Smart Serve`;
            } catch (error) {
                console.error("Error fetching restaurant:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, fetchRestaurantById]);

    // Memoized categories
    const categories = useMemo(() => {
        if (!restaurant?.menu) return ["All"];
        return ["All", ...new Set(restaurant.menu.map(item => item.category).filter(Boolean))];
    }, [restaurant?.menu]);

    // Memoized filtered menu
    const filteredMenu = useMemo(() => {
        if (!restaurant?.menu) return [];
        return restaurant.menu.filter((item) => {
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch && item.isAvailable;
        });
    }, [restaurant?.menu, selectedCategory, searchQuery]);

    // Optimized handlers
    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleCategoryChange = useCallback((category) => {
        setSelectedCategory(category);
    }, []);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
            </>
        );
    }

    if (!restaurant) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center text-gray-600 bg-gray-50">
                    Restaurant not found
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Hero */}
                <div className="relative h-64 bg-gray-200 dark:bg-gray-800">
                    {restaurant.coverImage && (
                        <img src={restaurant.coverImage} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="max-w-6xl mx-auto">
                            <button
                                onClick={() => router.back()}
                                className="mb-3 flex items-center gap-1 text-white/90 hover:text-white text-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </button>
                            <h1 className="text-3xl font-bold text-white mb-2">{restaurant.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {restaurant.address.city}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {restaurant.ratings?.average || "New"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {restaurant.openingHours?.open} - {restaurant.openingHours?.close}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Book Button */}
                    {restaurant.settings?.allowTableBooking && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Ready to book?</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Reserve your table for today or tomorrow</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        router.push('/login');
                                        return;
                                    }
                                    setShowBooking(true);
                                }}
                                className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                Book Table
                            </button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 mb-6 flex gap-1 border border-gray-200 dark:border-gray-700">
                        {["Menu", "About", "Reviews"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === tab.toLowerCase()
                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === "menu" && (
                        <div className="space-y-4">
                            {/* Search & Filter */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                />
                                <div className="flex gap-2 overflow-x-auto">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-sm transition-colors ${selectedCategory === cat
                                                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-3">
                                {filteredMenu.map((item) => (
                                    <div
                                        key={item._id}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex gap-4">
                                            {item.image && (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-24 h-24 object-cover rounded-lg"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                                                    </div>
                                                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 ml-4">₹{item.price}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.isVeg
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                                                    </span>
                                                    {item.category && (
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            {item.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "about" && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">About</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {restaurant.description || `Welcome to ${restaurant.name}.`}
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cuisine</div>
                                    <div className="font-medium text-gray-900 dark:text-white">{restaurant.cuisineType?.join(", ")}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</div>
                                    <div className="font-medium text-gray-900 dark:text-white">{restaurant.address.city}</div>
                                </div>
                            </div>

                            {/* Map Component */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-indigo-500" />
                                    Find Us
                                </h3>
                                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 h-80 w-full bg-gray-100 relative">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        title="Restaurant Location"
                                        src={(function () {
                                            const link = restaurant.address?.locationUrl;
                                            let query = "";

                                            if (link) {
                                                // 1. Try to extract specific coordinates (@lat,lng) - Highest Priority
                                                const coordsMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                                                if (coordsMatch) {
                                                    query = `${coordsMatch[1]},${coordsMatch[2]}`;
                                                }
                                                // 2. Try to extract 'q' parameter
                                                else {
                                                    const qMatch = link.match(/[?&]q=([^&]+)/);
                                                    if (qMatch) {
                                                        query = decodeURIComponent(qMatch[1]);
                                                    }
                                                    // 3. Try to extract place name from /place/PATH
                                                    else {
                                                        const placeMatch = link.match(/\/place\/([^/?]+)/);
                                                        if (placeMatch) {
                                                            query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                                                        }
                                                    }
                                                }
                                            }

                                            // 4. Fallback to address if no link info found
                                            if (!query) {
                                                query = `${restaurant.address?.street || ''}, ${restaurant.address?.city || ''}, ${restaurant.address?.state || ''}, ${restaurant.address?.pincode || ''}`;
                                            }

                                            return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                                        })()}
                                        className="absolute inset-0"
                                    ></iframe>
                                </div>
                                {restaurant.address?.locationUrl && (
                                    <div className="mt-3 text-right">
                                        <a
                                            href={restaurant.address.locationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            Open in Google Maps <ChevronLeft className="h-3 w-3 rotate-180" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {restaurant.ratings?.average || 0}
                                        <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{restaurant.ratings?.totalReviews || 0} reviews</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Customer Feedback</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Verified Ratings</p>
                                </div>
                            </div>

                            {/* Reviews List */}
                            {restaurant.reviews && restaurant.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {restaurant.reviews.slice().reverse().map((review, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-semibold text-gray-900 dark:text-white">{review.customerName || "Guest"}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex text-yellow-400 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-gray-300 dark:text-gray-600"}`}
                                                    />
                                                ))}
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                                    <Star className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Be the first to review!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showBooking && <BookingModal restaurant={restaurant} onClose={() => setShowBooking(false)} />}
            </div>
        </>
    );
}
