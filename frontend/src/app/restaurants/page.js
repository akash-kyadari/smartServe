"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Search, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/restaurants`);
                setRestaurants(data.restaurants);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, []);

    const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisineType.some(c => c.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Discover Restaurants</h1>
                        <p className="text-muted-foreground mt-1">Find the best dining spots near you</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or cuisine..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-secondary focus:ring-2 focus:ring-primary focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((restro) => (
                        <Link href={`/restaurants/${restro._id}`} key={restro._id} className="block group">
                            <div className="bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                {/* Image */}
                                <div className="h-48 bg-muted relative">
                                    {restro.coverImage ? (
                                        <img src={restro.coverImage} alt={restro.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                                            No Image
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                        ⭐ {restro.rating || "New"}
                                    </div>
                                    {restro.openingHours?.daysOpen && (
                                        <div className={`absolute bottom-4 left-4 px-2 py-1 rounded-md text-xs font-bold shadow-sm ${restro.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {restro.isOpen ? 'OPEN' : 'CLOSED'}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{restro.name}</h3>
                                    </div>

                                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                        {restro.cuisineType.join(" • ")}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{restro.address.city || "Unknown City"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{restro.openingHours?.open || "10 AM"} - {restro.openingHours?.close || "10 PM"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No restaurants found matching "{search}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
