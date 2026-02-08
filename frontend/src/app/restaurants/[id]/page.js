"use client";

import { useEffect, useState, use } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Loader2, MapPin, Star, Clock, Info } from "lucide-react";
import Menu from "@/components/customer/Menu";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function RestaurantDetails() {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("menu");

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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                Restaurant not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Image */}
            <div className="h-64 md:h-80 w-full relative bg-muted">
                {restaurant.coverImage ? (
                    <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Cover Image
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full">
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">{restaurant.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base opacity-90">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {restaurant.address.city}</span>
                        <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> {restaurant.rating || "New"}</span>
                        <span>• {restaurant.cuisineType.join(", ")}</span>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
                <div className="bg-card rounded-xl shadow-lg border p-6 mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1">About</h2>
                            <p className="text-muted-foreground text-sm line-clamp-3 md:line-clamp-none">
                                {restaurant.description || "Welcome to " + restaurant.name + ". We serve delicious food with high quality ingredients."}
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {restaurant.isOpen ? 'Open Now' : 'Closed'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-6 border-t pt-4">
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Timing</span>
                            <span className="font-medium">{restaurant.openingHours?.open} - {restaurant.openingHours?.close}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Average Cost</span>
                            <span className="font-medium">₹300 for two</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Contact</span>
                            <span className="font-medium">{restaurant.phone}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Features</span>
                            <span className="font-medium">{restaurant.isAC ? "AC Seating" : "Non-AC"}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-6 overflow-x-auto no-scrollbar">
                    {["Menu", "Reviews", "Photos"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === tab.toLowerCase()
                                ? "text-primary border-b-2 border-primary"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "menu" && (
                    <Menu
                        menu={restaurant.menu}
                        addToCart={() => { }} // Read only in details page
                        removeFromCart={() => { }}
                        cartItems={{}}
                    />
                )}

                {activeTab === "reviews" && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Reviews coming soon
                    </div>
                )}
                {activeTab === "photos" && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Photo gallery coming soon
                    </div>
                )}
            </div>

        </div>
    );
}
