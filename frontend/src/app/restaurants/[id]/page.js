"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import React from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, MapPin, Star, Calendar, Clock, Users, X, Check, ChevronLeft, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import useBookingsStore from "@/store/useBookingsStore";
import useRestaurantsListStore from "@/store/useRestaurantsListStore";
import socketService from "@/services/socketService";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

const BookingModal = React.memo(({ restaurant, onClose }) => {
    const [selectedDate, setSelectedDate] = useState("today");
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedTables, setSelectedTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [bookedTables, setBookedTables] = useState([]);

    // Use bookings store
    const { createBooking } = useBookingsStore();

    // Use refs for form inputs that don't need to trigger re-renders
    const occasionRef = useRef("");
    const notesRef = useRef("");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOptions = [
        { id: "today", label: "Today", date: today.toISOString().split('T')[0], display: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
        { id: "tomorrow", label: "Tomorrow", date: tomorrow.toISOString().split('T')[0], display: tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
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

    // Socket.IO connection for real-time updates
    useEffect(() => {
        // Connect to socket and join restaurant room
        socketService.connect();
        socketService.joinRestaurantRoom(restaurant._id);

        // Listen for table availability changes
        const handleTableUnavailable = (data) => {
            const { tableId, date, startTime, endTime } = data;
            const selectedDateObj = dateOptions.find(d => d.id === selectedDate);

            // If the unavailable table matches current selection, update booked tables
            if (selectedDateObj && date === selectedDateObj.date && startTime === selectedTime) {
                setBookedTables(prev => [...prev, tableId]);

                // Remove from selected tables if it was selected
                setSelectedTables(prev => prev.filter(id => id !== tableId));

                // Show notification
                setError(`Table just became unavailable. Please select another table.`);
                setTimeout(() => setError(null), 3000);
            }
        };

        const handleTableAvailable = (data) => {
            const { tableId, date, startTime } = data;
            const selectedDateObj = dateOptions.find(d => d.id === selectedDate);

            // If the available table matches current selection, update booked tables
            if (selectedDateObj && date === selectedDateObj.date && startTime === selectedTime) {
                setBookedTables(prev => prev.filter(id => id !== tableId));
            }
        };

        socketService.onTableUnavailable(handleTableUnavailable);
        socketService.onTableAvailable(handleTableAvailable);

        return () => {
            socketService.offTableUnavailable(handleTableUnavailable);
            socketService.offTableAvailable(handleTableAvailable);
        };
    }, [restaurant._id, selectedDate, selectedTime]);

    useEffect(() => {
        if (selectedDate && selectedTime) {
            fetchBookedTables();
        }
    }, [selectedDate, selectedTime]);

    const fetchBookedTables = async () => {
        try {
            const dateObj = dateOptions.find(d => d.id === selectedDate);
            const response = await axios.get(`${API_URL}/bookings`, {
                params: {
                    restaurantId: restaurant._id,
                    date: dateObj.date,
                    startTime: selectedTime
                },
                withCredentials: true
            });

            const booked = response.data.bookings?.map(b => b.tableId) || [];
            setBookedTables(booked);
        } catch (err) {
            console.error("Error fetching booked tables:", err);
            setBookedTables([]);
        }
    };

    const toggleTable = (tableId) => {
        if (bookedTables.includes(tableId)) return;

        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        );
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
                window.location.href = '/bookings';
            }, 1500);
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
                            onClick={onClose}
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
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose Tables</label>
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
                                        <span>Booked</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {restaurant.tables.map((table) => {
                                        const isBooked = bookedTables.includes(table._id);
                                        const isSelected = selectedTables.includes(table._id);

                                        return (
                                            <button
                                                key={table._id}
                                                onClick={() => toggleTable(table._id)}
                                                disabled={isBooked}
                                                className={`relative p-4 rounded-lg border-2 transition-all ${isBooked
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
                                                {isBooked && (
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
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("menu");
    const [showBooking, setShowBooking] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/restaurants/public/${id}`);
                setRestaurant(data.restaurant);
            } catch (error) {
                console.error("Error fetching restaurant:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

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
                                    {restaurant.rating || "4.5"}
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
                                onClick={() => setShowBooking(true)}
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
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                            <Star className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
                            <p className="text-gray-600 dark:text-gray-400">Be the first to review!</p>
                        </div>
                    )}
                </div>

                {showBooking && <BookingModal restaurant={restaurant} onClose={() => setShowBooking(false)} />}
            </div>
        </>
    );
}
