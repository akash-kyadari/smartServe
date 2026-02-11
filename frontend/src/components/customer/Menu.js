"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { Minus, Plus, Search, Star, X, ChefHat, ChevronDown, Check, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Menu({ menu, addToCart, removeFromCart, cartItems }) {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = ["All"];
        menu.forEach((item) => {
            if (item.category && !cats.includes(item.category)) {
                cats.push(item.category);
            }
        });
        return cats;
    }, [menu]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Logic
    const filteredMenu = useMemo(() => {
        return menu.filter((item) => {
            const matchesCategory = activeCategory === "All" || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch && item.isAvailable;
        });
    }, [menu, activeCategory, searchQuery]);

    const getQuantity = (itemId) => {
        return cartItems[itemId]?.quantity || 0;
    };

    return (
        <div className="pb-32 min-h-screen bg-white dark:bg-black transition-colors duration-300 relative">
            {/* Sticky Header */}
            <div className="sticky top-[3.5rem] z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="px-4 py-3 max-w-5xl mx-auto w-full">

                    <div className="flex gap-3 items-center relative">
                        {/* Search Bar */}
                        <div className="relative group flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 placeholder:text-gray-400 border border-transparent focus:border-black/5 dark:focus:border-white/10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-black dark:hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Container */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`
                                    h-11 px-4 flex items-center gap-2 justify-center rounded-2xl transition-all active:scale-95 font-bold text-sm border
                                    ${isFilterOpen || activeCategory !== "All"
                                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-lg"
                                        : "bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }
                                `}
                            >
                                <Filter size={16} />
                                <span className="hidden sm:inline">Categories</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* The Dropdown */}
                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 origin-top-right ring-1 ring-black/5"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Category</span>
                                        </div>

                                        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setActiveCategory(cat);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`
                                                        w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group
                                                        ${activeCategory === cat
                                                            ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
                                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"
                                                        }
                                                    `}
                                                >
                                                    <span>{cat}</span>
                                                    {activeCategory === cat && (
                                                        <motion.div layoutId="check">
                                                            <Check size={14} strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Active Filter Indicator Tag */}
                    <AnimatePresence>
                        {activeCategory !== "All" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active:</span>
                                    <button
                                        onClick={() => setActiveCategory("All")}
                                        className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 text-black dark:text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors group"
                                    >
                                        {activeCategory}
                                        <X size={12} className="group-hover:scale-110" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Menu List */}
            <div className="max-w-5xl mx-auto w-full p-4">
                {filteredMenu.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-8 gap-y-6">
                        {filteredMenu.map((item) => (
                            <MenuItem
                                key={item._id}
                                item={item}
                                qty={getQuantity(item._id)}
                                addToCart={addToCart}
                                removeFromCart={removeFromCart}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center opacity-60"
                    >
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No dishes found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// Extracted for performance & layout clarity
function MenuItem({ item, qty, addToCart, removeFromCart }) {
    return (
        <div className="flex justify-between items-start gap-4 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-900 hover:border-black/5 dark:hover:border-white/10 transition-all duration-300 relative group shadow-sm hover:shadow-md">

            {/* Left Content */}
            <div className="flex-1 space-y-2.5 min-w-0 py-1">
                {/* Veg/Non-Veg & Rating */}
                <div className="flex items-center gap-2">
                    <div className={`
                        w-4 h-4 border ${item.isVeg ? 'border-green-600' : 'border-red-600'} 
                        flex items-center justify-center rounded-[4px]
                    `}>
                        <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                    {/* Rating Badge */}
                    {item.rating && (
                        <div className="flex items-center gap-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                            <Star size={10} className="fill-current" /> {item.rating}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug tracking-tight pr-2">
                        {item.name}
                    </h3>
                    <div className="font-bold text-gray-900 dark:text-white text-base">
                        ₹{item.price}
                    </div>
                </div>

                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed pr-2">
                    {item.description}
                </p>
            </div>

            {/* Right Image & Action */}
            <div className="relative w-28 sm:w-32 shrink-0 flex flex-col items-center">
                <div className="w-28 sm:w-32 h-28 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative shadow-inner border border-black/5 dark:border-white/5">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                            <ChefHat size={32} strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                {/* ADD Button */}
                <div className="absolute -bottom-3 w-20 sm:w-24 z-10">
                    {qty > 0 ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center justify-between bg-black text-white dark:bg-white dark:text-black h-8 sm:h-9 rounded-xl shadow-xl overflow-hidden font-bold text-xs sm:text-sm ring-2 ring-white dark:ring-black"
                        >
                            <button
                                onClick={() => removeFromCart(item)}
                                className="w-7 sm:w-8 h-full flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:bg-gray-700"
                            >
                                <Minus size={12} strokeWidth={3} />
                            </button>
                            <span className="tabular-nums">{qty}</span>
                            <button
                                onClick={() => addToCart(item)}
                                className="w-7 sm:w-8 h-full flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors active:bg-gray-700"
                            >
                                <Plus size={12} strokeWidth={3} />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button
                            onClick={() => addToCart(item)}
                            whileTap={{ scale: 0.95 }}
                            className="w-full h-8 sm:h-9 bg-white text-green-600 dark:bg-gray-900 dark:text-green-400 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg font-extrabold text-xs sm:text-sm uppercase tracking-wide hover:bg-green-50 dark:hover:bg-gray-800 transition-all"
                        >
                            ADD
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
