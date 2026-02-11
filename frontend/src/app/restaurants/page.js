"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Loader2, MapPin, Star, Clock, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import useRestaurantsListStore from "@/store/useRestaurantsListStore";

// Memoized Restaurant Card Component with Dark Mode
const RestaurantCard = React.memo(({ restaurant }) => (
    <a
        href={`/restaurants/${restaurant._id}`}
        className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
    >
        {/* Image */}
        <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
            {restaurant.coverImage ? (
                <img
                    src={restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    No image
                </div>
            )}
            {/* Rating */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{restaurant.ratings?.average || "4.5"}</span>
            </div>
        </div>

        {/* Content */}
        <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {restaurant.name}
            </h3>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-3">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address.city}</span>
            </div>

            {/* Cuisine */}
            {restaurant.cuisineType && restaurant.cuisineType.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {restaurant.cuisineType.slice(0, 3).map((cuisine, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                        >
                            {cuisine}
                        </span>
                    ))}
                </div>
            )}

            {/* Timing */}
            {restaurant.openingHours && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>
                        {restaurant.openingHours.open} - {restaurant.openingHours.close}
                    </span>
                </div>
            )}
        </div>
    </a>
));

RestaurantCard.displayName = 'RestaurantCard';

export default function RestaurantsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef(null);

    // Use store instead of local state
    const { restaurants, isLoading, fetchRestaurants } = useRestaurantsListStore();

    useEffect(() => {
        // Fetch restaurants (will use cache if available)
        fetchRestaurants();
    }, [fetchRestaurants]);

    // Memoized filtered restaurants to prevent unnecessary recalculations
    const filteredRestaurants = useMemo(() => {
        if (!searchTerm.trim()) return restaurants;

        const lowerSearch = searchTerm.toLowerCase();
        return restaurants.filter((r) =>
            r.name.toLowerCase().includes(lowerSearch) ||
            r.cuisineType?.some(c => c.toLowerCase().includes(lowerSearch))
        );
    }, [restaurants, searchTerm]);

    // Optimized search handler
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    if (isLoading && restaurants.length === 0) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Restaurants</h1>
                        <p className="text-gray-600 dark:text-gray-400">Discover great places to dine</p>
                    </div>

                    {/* Search */}
                    <div className="mb-8">
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search restaurants or cuisine..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    {filteredRestaurants.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400">No restaurants found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRestaurants.map((restaurant) => (
                                <RestaurantCard
                                    key={restaurant._id}
                                    restaurant={restaurant}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
