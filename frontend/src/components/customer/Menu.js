"use client";
import { useState, useMemo } from "react";
import { Minus, Plus, Search, Filter, Star } from "lucide-react";
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
        <div className="pb-32 bg-secondary/10 min-h-screen">
            {/* Search & Filter - Sticky under main header */}
            <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50 pb-2 pt-2">
                <div className="px-4 mb-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all transform active:scale-95 ${activeCategory === cat
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary ring-offset-2 ring-offset-background"
                                : "bg-white dark:bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="p-4 grid gap-5 max-w-2xl mx-auto">
                <AnimatePresence mode="popLayout">
                    {filteredMenu.map((item) => {
                        const qty = getQuantity(item._id);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={item._id}
                                className="group relative bg-card rounded-2xl p-3 shadow-sm border border-border/50 hover:border-primary/20 transition-all flex gap-4 overflow-hidden"
                            >
                                {/* Image Section */}
                                <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-secondary relative shadow-inner">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] font-medium bg-secondary/80">No Image</div>
                                    )}
                                    {/* Veg Badge */}
                                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm p-1 rounded shadow-sm z-10">
                                        <div className={`w-3 h-3 border ${item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                        </div>
                                    </div>
                                    {/* Rating Badge (Mock) */}
                                    {item.rating > 4 && (
                                        <div className="absolute bottom-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                            <Star size={8} className="fill-black" /> {item.rating}
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 flex flex-col justify-between py-1 pr-1">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-base text-foreground line-clamp-2 leading-tight">{item.name}</h3>
                                            <span className="font-bold text-foreground text-sm">₹{item.price}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{item.description}</p>
                                    </div>

                                    <div className="flex items-end justify-between mt-3">
                                        {/* Tags or Calories (Mock) */}
                                        <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded inline-block">
                                            {item.category}
                                        </span>

                                        {/* Add Button */}
                                        {qty > 0 ? (
                                            <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg px-2 py-1 shadow-md shadow-primary/20">
                                                <button
                                                    onClick={() => removeFromCart(item)}
                                                    className="p-1 hover:bg-black/10 rounded-md transition-colors"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center tabular-nums">{qty}</span>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="p-1 hover:bg-black/10 rounded-md transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="h-8 px-6 bg-secondary text-primary border border-primary/20 font-bold rounded-lg shadow-sm text-xs tracking-wider uppercase hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filteredMenu.length === 0 && (
                    <div className="text-center py-20 flex flex-col items-center opacity-60">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-lg">No dishes found</h3>
                        <p className="text-muted-foreground text-sm">Try searching for something else</p>
                    </div>
                )}
            </div>
        </div>
    );
}
