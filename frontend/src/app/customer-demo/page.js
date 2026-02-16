"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, ShoppingBag, UtensilsCrossed, Clock, CheckCircle, Star, ArrowLeft, Plus, Minus, Search, Leaf, Flame, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { useTheme } from "next-themes";

// --- Mock Data ---
const CATEGORIES = ["Recommended", "Starters", "Pizzas", "Bowls", "Drinks"];

const MENU_ITEMS = [
    {
        _id: 1,
        name: "Truffle Mushroom Pizza",
        price: 450,
        type: "veg",
        category: "Pizzas",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
        description: "Wild mushrooms, truffle oil, mozzarella, fresh thyme.",
    },
    {
        _id: 2,
        name: "Spicy Chicken Wings",
        price: 320,
        type: "non-veg",
        category: "Starters",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=500&q=80",
        description: "Glazed in hot sriracha sauce with scallions.",
    },
    {
        _id: 3,
        name: "Burrata Salad",
        price: 380,
        type: "veg",
        category: "Starters",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80",
        description: "Fresh burrata, heirloom tomatoes, basil pesto.",
    },
    {
        _id: 4,
        name: "Avocado Smoothie",
        price: 250,
        type: "veg",
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=500&q=80",
        description: "Creamy avocado, honey, almond milk.",
    },
    {
        _id: 5,
        name: "Paneer Tikka Bowl",
        price: 290,
        type: "veg",
        category: "Bowls",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80",
        description: "Grilled paneer, saffron rice, makhani gravy.",
    },
];

const INITIAL_ORDERS = [
    {
        _id: "O1",
        createdAt: new Date().toISOString(),
        status: "PREPARING",
        items: [{ name: "Spicy Chicken Wings", quantity: 1, price: 320 }],
        totalAmount: 320
    }
];

// --- Components ---

const ThemeToggle = () => {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ml-2 ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}
        >
            <span
                className={`${resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </button>
    );
};

// Simplified Mock Components to match real structure
const Menu = ({ menu, addToCart, removeFromCart, cartItems }) => (
    <div className="pb-24">
        <div className="sticky top-[108px] z-30 bg-background/95 backdrop-blur-md shadow-sm border-b border-border">
            <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 py-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={clsx(
                            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                            cat === "Recommended" ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="px-4 py-6 space-y-6">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search for dishes..."
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
                <Search className="absolute left-3.5 top-3.5 text-muted-foreground" size={20} />
            </div>

            {menu.map((item) => (
                <div key={item._id} className="group relative bg-card text-card-foreground rounded-3xl p-3 shadow-sm border border-border flex gap-4 overflow-hidden">
                    <div className="h-32 w-32 shrink-0 rounded-2xl overflow-hidden bg-secondary relative">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div className="flex items-start justify-between">
                                <h3 className="font-bold text-lg leading-tight line-clamp-2">{item.name}</h3>
                                <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border ml-1 h-fit",
                                    item.type === 'veg' ? "border-green-500/50 text-green-600 bg-green-50" : "border-red-500/50 text-red-600 bg-red-50"
                                )}>
                                    {item.type === 'veg' ? <Leaf size={10} /> : <Flame size={10} />}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-lg">₹{item.price}</span>
                            {cartItems[item._id] ? (
                                <div className="flex items-center bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 overflow-hidden">
                                    <button onClick={() => removeFromCart(item)} className="p-2 hover:bg-black/10 transition-colors"><Minus size={16} /></button>
                                    <span className="w-6 text-center font-bold text-sm">{cartItems[item._id].quantity}</span>
                                    <button onClick={() => addToCart(item)} className="p-2 hover:bg-black/10 transition-colors"><Plus size={16} /></button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => addToCart(item)}
                                    className="px-6 py-2 bg-secondary text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                                >
                                    ADD
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Cart = ({ items, updateQuantity, handlePlaceOrder }) => {
    if (items.length === 0) return null;
    const totalItems = items.reduce((a, b) => a + b.quantity, 0);
    const totalPrice = items.reduce((a, b) => a + (b.price * b.quantity), 0);

    return (
        <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 pb-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl">
            <div className="container mx-auto max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{totalItems} Items in Cart</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-foreground">₹{totalPrice}</span>
                            <span className="text-xs text-muted-foreground">+ taxes</span>
                        </div>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Place Order <ShoppingBag size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrderTracker = ({ order }) => (
    <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl ${order.status === 'PREPARING' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
            }`}>
            {order.status}
        </div>
        <div className="space-y-3">
            {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground bg-secondary h-6 w-6 flex items-center justify-center rounded-md text-xs">{item.quantity}x</span>
                        <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                </div>
            ))}
        </div>
        <div className="mt-4 pt-3 border-t border-dashed border-border flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total Amount</span>
            <span className="font-bold text-lg">₹{order.totalAmount}</span>
        </div>
    </div>
);


export default function CustomerPage() {
    const [viewMode, setViewMode] = useState("MENU");
    const [cart, setCart] = useState({});
    const [activeOrders, setActiveOrders] = useState(INITIAL_ORDERS);
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const [restaurant] = useState({
        name: "The Saffron Table",
        coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        address: { city: "New Delhi" },
        menu: MENU_ITEMS,
        isOpen: true,
        isActive: true
    });

    // Call Waiter State
    const [requestService, setRequestService] = useState(false);

    // Initial Load
    useEffect(() => {
        const storedName = localStorage.getItem("customerName");
        const storedPhone = localStorage.getItem("customerPhone");
        if (storedName && storedPhone) {
            setCustomerInfo({ name: storedName, phone: storedPhone });
            setIsSessionStarted(true);
        }
    }, []);

    const addToCart = (item) => {
        setCart(prev => ({
            ...prev,
            [item._id]: { ...item, quantity: (prev[item._id]?.quantity || 0) + 1 }
        }));
    };

    const removeFromCart = (item) => {
        setCart(prev => {
            const currentQty = prev[item._id]?.quantity || 0;
            if (currentQty <= 1) {
                const newCart = { ...prev };
                delete newCart[item._id];
                return newCart;
            }
            return {
                ...prev,
                [item._id]: { ...item, quantity: currentQty - 1 }
            };
        });
    };

    const updateQuantity = (item, delta) => {
        if (delta > 0) addToCart(item);
        else removeFromCart(item);
    };

    const handlePlaceOrder = () => {
        const items = Object.values(cart);
        const total = items.reduce((a, b) => a + (b.price * b.quantity), 0);

        const newOrder = {
            _id: `O${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: "PLACED",
            items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
            totalAmount: total
        };

        setActiveOrders([newOrder, ...activeOrders]);
        setCart({});
        setViewMode("TRACKER");
    };

    const handleStartSession = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = fd.get("name");
        const phone = fd.get("phone");
        if (!name || !phone) return;

        localStorage.setItem("customerName", name);
        localStorage.setItem("customerPhone", phone);
        setCustomerInfo({ name, phone });
        setIsSessionStarted(true);
    };

    if (!isSessionStarted) {
        return (
            <div className="flex flex-col h-screen bg-background relative overflow-hidden font-sans text-foreground">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    <img src={restaurant.coverImage} alt="Background" className="w-full h-full object-cover opacity-50 blur-sm" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full relative z-10">
                    <div className="text-center mb-10 text-white">
                        <div className="inline-block p-5 rounded-2xl bg-white/10 backdrop-blur-md shadow-xl mb-6 border border-white/20">
                            <UtensilsCrossed size={40} className="text-primary" />
                        </div>
                        <h1 className="text-4xl font-black mb-3 tracking-tight">{restaurant.name}</h1>
                        <p className="text-white/80 text-lg">Welcome! Please enter your details.</p>
                    </div>

                    <form onSubmit={handleStartSession} className="w-full space-y-5 bg-card/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50">
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Your Name</label>
                            <input name="name" required className="w-full p-4 rounded-xl border border-input bg-secondary/50 focus:bg-background transition-all focus:ring-2 ring-primary/20 outline-none" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Phone Number</label>
                            <input name="phone" type="tel" required className="w-full p-4 rounded-xl border border-input bg-secondary/50 focus:bg-background transition-all focus:ring-2 ring-primary/20 outline-none" placeholder="9876543210" />
                        </div>
                        <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all mt-4">
                            Start Ordering
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground pb-20">
            {/* App Navbar */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm px-4 py-3 flex justify-between items-center">
                <Link href="/business" className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></Link>
                <div className="text-center">
                    <h1 className="text-sm font-bold">{restaurant.name}</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Table 12</p>
                </div>
                <div className="flex gap-2">
                    <ThemeToggle />
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-primary border border-border">
                        {customerInfo.name.charAt(0)}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative h-48 w-full bg-slate-900 shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                <img src={restaurant.coverImage} alt="Restaurant" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute bottom-0 left-0 w-full p-5 z-20 text-white">
                    <h1 className="text-3xl font-bold mb-1 tracking-tight">{restaurant.name}</h1>
                    <div className="flex items-center gap-1 text-sm font-medium opacity-90">
                        <MapPin size={12} /> {restaurant.address.city}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-[53px] z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
                <div className="flex">
                    <button onClick={() => setViewMode("MENU")} className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all relative ${viewMode === 'MENU' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        Menu
                        {viewMode === 'MENU' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    <button onClick={() => setViewMode("TRACKER")} className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all relative ${viewMode === 'TRACKER' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        My Orders
                        {activeOrders.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full align-middle">{activeOrders.length}</span>}
                        {viewMode === 'TRACKER' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {viewMode === "MENU" ? (
                        <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <Menu menu={MENU_ITEMS} addToCart={addToCart} removeFromCart={removeFromCart} cartItems={cart} />
                        </motion.div>
                    ) : (
                        <motion.div key="tracker" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="container mx-auto p-4">
                            <div className="space-y-6 max-w-lg mx-auto">
                                <h2 className="text-lg font-bold">Current Session</h2>
                                {activeOrders.map((order, idx) => (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <Clock size={12} className="text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Just Now</span>
                                        </div>
                                        <OrderTracker order={order} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cart Trigger */}
            {viewMode === "MENU" && <Cart items={Object.values(cart)} updateQuantity={updateQuantity} handlePlaceOrder={handlePlaceOrder} />}

            {/* Call Waiter FAB */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setRequestService(!requestService)}
                className={`fixed bottom-24 right-4 z-40 p-3 rounded-full shadow-lg flex items-center justify-center transition-colors ${requestService ? 'bg-yellow-500 text-white animate-pulse' : 'bg-white text-yellow-500 border border-yellow-200'}`}
            >
                {requestService ? <UtensilsCrossed size={24} /> : <div className="flex flex-col items-center"><span className="text-[10px] font-bold">Call</span><span className="text-[10px] font-bold">Waiter</span></div>}
            </motion.button>
        </div>
    );
}
