"use client";
import { useState, useMemo } from "react";
import { Minus, Plus, Search, Star, Sparkles, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Menu({ menu, addToCart, removeFromCart, cartItems }) {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const categories = useMemo(() => {
        const cats = ["All"];
        menu.forEach((item) => {
            if (item.category && !cats.includes(item.category)) {
                cats.push(item.category);
            }
        });
        return cats;
    }, [menu]);

    const filteredMenu = useMemo(() => {
        return menu.filter((item) => {
            const matchesCategory = activeCategory === "All" || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch && item.isAvailable;
        });
    }, [menu, activeCategory, searchQuery]);

    const getQuantity = (itemId) => {
        return cartItems[itemId]?.quantity || 0;
    };

    return (
        <div className="pb-32 min-h-screen">
            {/* Search & Filter - Sticky */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/50 pb-4 pt-4">
                <div className="px-4 mb-4">
                    <div className="relative group max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search for your favorite dish..."
                            className="w-full pl-12 pr-4 py-3.5 bg-card border-2 border-border focus:border-primary/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex overflow-x-auto px-4 gap-2 no-scrollbar pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all transform active:scale-95 ${activeCategory === cat
                                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                                    : "bg-card border-2 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:shadow-md"
                                }`}
                        >
                            {cat === "All" && <Sparkles className="inline h-4 w-4 mr-1" />}
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid - Premium Layout */}
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMenu.map((item) => {
                            const qty = getQuantity(item._id);
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={item._id}
                                    className="group relative bg-card rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-border/50 hover:border-primary/30 transition-all duration-300"
                                >
                                    {/* Image Section */}
                                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-secondary/30 to-secondary/10">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                                <ChefHat className="h-16 w-16 mb-2 opacity-20" />
                                                <span className="text-xs font-medium opacity-50">No Image</span>
                                            </div>
                                        )}

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Veg/Non-Veg Badge */}
                                        <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-md p-1.5 rounded-lg shadow-lg z-10">
                                            <div className={`w-4 h-4 border-2 ${item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm`}>
                                                <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                            </div>
                                        </div>

                                        {/* Rating Badge */}
                                        {item.rating && item.rating >= 4 && (
                                            <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-black px-2.5 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10">
                                                <Star size={12} className="fill-white" />
                                                {item.rating}
                                            </div>
                                        )}

                                        {/* Price Tag - Floating */}
                                        <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg z-10">
                                            <span className="font-black text-lg text-primary">₹{item.price}</span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-5">
                                        <div className="mb-3">
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                                {item.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {item.description || "Delicious dish prepared with care"}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Category Tag */}
                                            <span className="text-[10px] font-bold text-primary/70 bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                                {item.category}
                                            </span>

                                            {/* Add to Cart Button */}
                                            {qty > 0 ? (
                                                <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-full px-3 py-2 shadow-lg shadow-primary/30">
                                                    <button
                                                        onClick={() => removeFromCart(item)}
                                                        className="p-1 hover:bg-white/20 rounded-full transition-colors active:scale-90"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-sm font-black w-6 text-center tabular-nums">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="p-1 hover:bg-white/20 rounded-full transition-colors active:scale-90"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="px-5 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-2 border-primary/20 hover:border-primary font-bold rounded-full shadow-sm text-xs uppercase tracking-wider transition-all active:scale-95 hover:shadow-lg hover:shadow-primary/20"
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hover Shine Effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>

                {filteredMenu.length === 0 && (
                    <div className="text-center py-24 flex flex-col items-center">
                        <div className="bg-secondary/30 p-8 rounded-full mb-6">
                            <Search className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                        <h3 className="font-bold text-2xl text-foreground mb-2">No dishes found</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                            Try adjusting your search or browse a different category
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
