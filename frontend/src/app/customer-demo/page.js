"use client";

import React, { useState, useEffect } from "react";
import { Bell, Minus, Plus, ShoppingBag, Leaf, Flame, Search, ArrowLeft, Sun, Moon, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- Mock Data ---
const CATEGORIES = ["Recommended", "Starters", "Pizzas", "Bowls", "Drinks"];

const MENU_ITEMS = [
    {
        id: 1,
        name: "Truffle Mushroom Pizza",
        price: 450,
        type: "veg",
        category: "Pizzas",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
        description: "Wild mushrooms, truffle oil, mozzarella, fresh thyme.",
    },
    {
        id: 2,
        name: "Spicy Chicken Wings",
        price: 320,
        type: "non-veg",
        category: "Starters",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=500&q=80",
        description: "Glazed in hot sriracha sauce with scallions.",
    },
    {
        id: 3,
        name: "Burrata Salad",
        price: 380,
        type: "veg",
        category: "Starters",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80",
        description: "Fresh burrata, heirloom tomatoes, basil pesto.",
    },
    {
        id: 4,
        name: "Avocado Smoothie",
        price: 250,
        type: "veg",
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=500&q=80",
        description: "Creamy avocado, honey, almond milk.",
    },
    {
        id: 5,
        name: "Paneer Tikka Bowl",
        price: 290,
        type: "veg",
        category: "Bowls",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80",
        description: "Grilled paneer, saffron rice, makhani gravy.",
    },
];

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    // Ensure mounted to prevent hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />; // placeholder

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-foreground"
        >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default function CustomerPage() {
    const [activeCategory, setActiveCategory] = useState("Recommended");
    const [cart, setCart] = useState({}); // { itemId: qty }
    const [isCallingWaiter, setIsCallingWaiter] = useState(false);

    // Mock hydration check
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return <div className="min-h-screen bg-background" />;

    const getItemQty = (id) => cart[id] || 0;

    const updateQty = (id, delta) => {
        setCart((prev) => {
            const current = prev[id] || 0;
            const newQty = Math.max(0, current + delta);
            const newCart = { ...prev, [id]: newQty };
            if (newQty === 0) delete newCart[id];
            return newCart;
        });
    };

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalPrice = Object.entries(cart).reduce((total, [id, qty]) => {
        const item = MENU_ITEMS.find((i) => i.id === parseInt(id));
        return total + (item ? item.price * qty : 0);
    }, 0);

    const toggleWaiterCall = () => {
        setIsCallingWaiter(!isCallingWaiter);
        if (!isCallingWaiter) {
            setTimeout(() => setIsCallingWaiter(false), 5000); // Reset after 5s
        }
    };

    return (
        <div className="min-h-screen bg-uibg pb-24 font-sans text-foreground flex justify-center">
            <div className="w-full max-w-md bg-white dark:bg-slate-950 min-h-screen shadow-xl relative border-x border-border">

                {/* --- Header --- */}
                <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-border px-4 py-3 flex items-center justify-between">
                    <Link href="/business" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Link>

                    <div className="text-center">
                        <h1 className="text-lg font-bold tracking-tight text-foreground">The Saffron Table</h1>
                        <p className="text-xs font-medium text-muted-foreground">Table 12</p>
                    </div>

                    <div className="flex gap-2">
                        <ThemeToggle />
                        <button
                            onClick={toggleWaiterCall}
                            className={clsx(
                                "p-2 rounded-full transition-all duration-300 relative",
                                isCallingWaiter ? "bg-sunset text-white shadow-lg shadow-sunset/40" : "bg-secondary text-muted-foreground"
                            )}
                        >
                            <Bell size={20} className={isCallingWaiter ? "animate-swing" : ""} />
                            {isCallingWaiter && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* --- Categories --- */}
                <div className="sticky top-[61px] z-40 bg-white dark:bg-slate-950 shadow-sm border-b border-border">
                    <ul className="flex overflow-x-auto no-scrollbar gap-6 px-4 py-3">
                        {CATEGORIES.map((cat) => (
                            <li key={cat} className="shrink-0">
                                <button
                                    onClick={() => setActiveCategory(cat)}
                                    className={clsx(
                                        "text-sm font-semibold transition-colors relative pb-1",
                                        activeCategory === cat ? "text-sunset" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {cat}
                                    {activeCategory === cat && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute -bottom-3 left-0 right-0 h-0.5 bg-sunset rounded-full"
                                        />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* --- Menu List --- */}
                <main className="px-4 py-6 space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-sunset/20 text-sm font-medium placeholder-muted-foreground dark:text-white"
                        />
                        <Search className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                    </div>

                    {MENU_ITEMS.map((item) => (
                        <div key={item.id} className="group relative bg-card text-card-foreground rounded-2xl p-3 shadow-sm border border-border flex gap-4 overflow-hidden">
                            {/* Image */}
                            <div className="h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-secondary">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-foreground leading-tight">{item.name}</h3>
                                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border ml-1",
                                            item.type === 'veg' ? "border-green-500/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20" : "border-red-500/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                                        )}>
                                            {item.type === 'veg' ? <Leaf size={8} /> : <Flame size={8} />}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <span className="font-bold text-foreground">₹{item.price}</span>

                                    {getItemQty(item.id) === 0 ? (
                                        <button
                                            onClick={() => updateQty(item.id, 1)}
                                            className="px-6 py-1.5 bg-secondary text-sunset font-semibold text-sm rounded-lg hover:bg-sunset hover:text-white transition-colors"
                                        >
                                            ADD
                                        </button>
                                    ) : (
                                        <div className="flex items-center bg-sunset text-white rounded-lg px-2 py-1 shadow-md shadow-sunset/30">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white/20 rounded"><Minus size={14} /></button>
                                            <span className="mx-3 font-semibold text-sm w-3 text-center">{getItemQty(item.id)}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white/20 rounded"><Plus size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </main>

                {/* --- Floating Cart Bar --- */}
                <AnimatePresence>
                    {totalItems > 0 && (
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="absolute bottom-4 inset-x-4 z-50"
                        >
                            <div className="bg-foreground text-background p-4 rounded-2xl shadow-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer">
                                {/* Vibe Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-black/10 to-transparent translate-x-[-100%] group-hover:animate-shine" />

                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{totalItems} ITEMS</span>
                                    <span className="text-lg font-bold">₹{totalPrice}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold mr-1">Place Order</span>
                                    <div className="bg-sunset text-white p-2 rounded-xl">
                                        <ShoppingBag size={20} fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
