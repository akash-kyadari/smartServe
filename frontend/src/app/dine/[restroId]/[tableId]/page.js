"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ShoppingBag, UtensilsCrossed, ChevronLeft, Clock, History, MapPin, Phone, CheckCircle, Star, MoveRight } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Menu from "@/components/customer/Menu";
import Cart from "@/components/customer/Cart";
import OrderTracker from "@/components/customer/OrderTracker";
import CustomerNavbar from "@/components/customer/CustomerNavbar";

// API
const API_URL = (process.env.NEXT_PUBLIC_API_URL) + "/api";

export default function TablePage({ params }) {
    const { restroId, tableId } = useParams();
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState("MENU"); // 'MENU', 'TRACKER'
    const [restaurant, setRestaurant] = useState(null);
    const [table, setTable] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [cart, setCart] = useState({});

    // Session State
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);

    // Rating State
    const [showRating, setShowRating] = useState(false);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const submitReview = async () => {
        if (rating === 0) return;
        setSubmittingReview(true);
        try {
            await axios.post(`${API_URL}/restaurants/public/${restroId}/review`, {
                rating,
                comment: review,
                customerName: customerInfo.name
            });
            setShowRating(false); // Proceed to Thank You
        } catch (error) {
            console.error("Failed to submit review", error);
            setShowRating(false); // Proceed anyway
        } finally {
            setSubmittingReview(false);
        }
    };

    // Initial Load
    useEffect(() => {
        const storedName = localStorage.getItem("customerName");
        const storedPhone = localStorage.getItem("customerPhone");
        if (storedName && storedPhone) {
            setCustomerInfo({ name: storedName, phone: storedPhone });
            setIsSessionStarted(true);
        }
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!restroId || !tableId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Check Table Status
                const statusRes = await axios.get(`${API_URL}/restaurants/public/${restroId}/table/${tableId}`);
                const tableData = statusRes.data.table;
                setTable(tableData);

                // 2. Fetch Active Orders if Occupied
                if (tableData.isOccupied) {
                    try {
                        const orderRes = await axios.get(`${API_URL}/orders/${restroId}/${tableId}`);
                        const active = orderRes.data || [];
                        if (active.length > 0) {
                            setActiveOrders(active);
                            setViewMode("TRACKER"); // Restore session view
                        }
                    } catch (e) {
                        console.warn("Failed to fetch active orders", e);
                    }
                }

                // 3. Fetch Restaurant Details
                const restroRes = await axios.get(`${API_URL}/restaurants/public/${restroId}`);
                setRestaurant(restroRes.data.restaurant);

            } catch (err) {
                console.error("Error loading table:", err);
                setError("Restaurant or Table not found. Please scan again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Socket Connection
        const socket = getSocket();
        socket.emit("join_table_room", { restroId, tableId });
        socket.emit("join_public_room", restroId); // New Room for Restro-wide updates

        socket.on("restaurant_status_update", (status) => {
            console.log("Restaurant Status Update:", status);
            setRestaurant(prev => prev ? { ...prev, ...status } : prev);
            if (!status.isOpen || !status.isActive) {
                alert("Restaurant has closed or is not accepting orders.");
            }
        });

        socket.on("order_update", (updatedOrder) => {
            if (updatedOrder.status === "COMPLETED") {
                setActiveOrders(prev => {
                    const next = prev.filter(o => o._id !== updatedOrder._id);
                    return next;
                });
            } else {
                setActiveOrders(prev => {
                    const exists = prev.find(o => o._id === updatedOrder._id);
                    if (exists) {
                        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                    } else {
                        setViewMode("TRACKER");
                        return [updatedOrder, ...prev];
                    }
                });
            }
        });

        socket.on("menu_stock_update", (updatedItems) => {
            console.log("Menu Stock Update:", updatedItems);
            setRestaurant(prev => {
                if (!prev) return prev;
                const newMenu = prev.menu.map(item => {
                    const update = updatedItems.find(u => u._id === item._id);
                    if (update) {
                        return { ...item, ...update };
                    }
                    return item;
                });
                return { ...prev, menu: newMenu };
            });

            // Update Cart Items if they exist in the update
            setCart(prev => {
                const newCart = { ...prev };
                let changed = false;
                updatedItems.forEach(update => {
                    if (newCart[update._id]) {
                        // Careful not to overwrite quantity or addons
                        newCart[update._id] = {
                            ...newCart[update._id],
                            stock: update.stock,
                            isAvailable: update.isAvailable,
                            name: update.name || newCart[update._id].name, // If name changed
                            price: update.price || newCart[update._id].price
                        };
                        changed = true;
                    }
                });
                return changed ? newCart : prev;
            });
        });

        socket.on("table_freed", () => {
            // Session Ended by Waiter
            setSessionEnded(true);
            setIsSessionStarted(false);
            setShowRating(true); // Show rating modal
            // Do NOT remove customer details so they persist for next time
            // localStorage.removeItem("customerName");
            // localStorage.removeItem("customerPhone");
            localStorage.removeItem("cart"); // Cart should probably be cleared though
            setActiveOrders([]);
            setTable(prev => ({ ...prev, isOccupied: false }));
            setCart({});
        });

        socket.on("table_service_update", (data) => {
            setTable(prev => ({ ...prev, requestService: data.requestService }));
        });

        socket.on("table_bill_update", (data) => {
            setTable(prev => ({ ...prev, requestBill: data.requestBill }));
        });

        return () => {
            socket.off("order_update");
            socket.off("table_freed");
            socket.off("table_service_update");
            socket.off("table_bill_update");
            socket.off("restaurant_status_update");
            socket.off("menu_stock_update");
        };

    }, [restroId, tableId]);

    // Actions
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
        setSessionEnded(false);
    };

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

    const handlePlaceOrder = async (orderPayload) => {
        // Enforce session details
        const details = {
            name: customerInfo.name || orderPayload.customerDetails.name,
            phone: customerInfo.phone || orderPayload.customerDetails.phone
        };

        const items = Object.values(cart).map(item => ({
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            addons: []
        }));

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        try {
            await axios.post(`${API_URL}/orders/place`, {
                restaurantId: restroId,
                tableId: tableId,
                tableNo: table?.tableNumber,
                items,
                totalAmount,
                customerDetails: details
            });
            setCart({});
            setViewMode("TRACKER");
            setViewMode("TRACKER");
        } catch (err) {
            console.error("Failed to place order", err);

            if (err.response && err.response.status === 503) {
                alert(err.response.data.message || "We are currently not serving. Please try again later.");
            } else {
                alert("Failed to place order: " + (err.response?.data?.message || err.message));
            }
        }
    };

    // Render States
    if (loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-wide uppercase">Creating Experience...</p>
            </div>
        );
    }

    if (error || !restaurant) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4 opacity-80" />
                <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all">Retry</button>
            </div>
        );
    }

    if (sessionEnded) {
        if (showRating) {
            return (
                <div className="flex flex-col h-screen items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-background text-foreground">
                    <div className="max-w-md w-full space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">How was your food?</h2>
                            <p className="text-muted-foreground">Please rate your experience at {restaurant?.name}</p>
                        </div>

                        <div className="flex justify-center gap-2 py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        size={40}
                                        className={`${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Write a review (optional)..."
                            className="w-full p-4 rounded-xl border border-input bg-secondary/50 focus:bg-background transition-all focus:ring-2 ring-primary/20 outline-none resize-none h-32"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRating(false)}
                                className="flex-1 py-3 rounded-xl font-medium text-muted-foreground hover:bg-secondary transition-colors"
                            >
                                Skip
                            </button>
                            <button
                                onClick={submitReview}
                                disabled={rating === 0 || submittingReview}
                                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {submittingReview ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-screen items-center justify-center p-6 text-center animate-in fade-in duration-500 bg-background text-foreground">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full text-emerald-600 dark:text-emerald-400 mb-6 shadow-lg shadow-emerald-500/10">
                    <UtensilsCrossed size={48} />
                </div>
                <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
                <p className="text-muted-foreground mb-8">We hope you enjoyed your dining experience at {restaurant?.name}.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-primary/25"
                >
                    Start New Session
                </button>
            </div>
        );
    }

    if (!isSessionStarted) {
        return (
            <div className="flex flex-col h-screen bg-background relative overflow-hidden font-sans ">
                {/* Background Image */}
                {restaurant?.coverImage && (
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-black/60 z-10" /> {/* Dark overlay */}
                        <img
                            src={restaurant.coverImage}
                            alt="Background"
                            className="w-full h-full object-cover opacity-50 blur-sm"
                        />
                    </div>
                )}
                {/* Background decoration (keep for fallback or added effect) */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10" />

                <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full animate-in slide-in-from-bottom-10 fade-in duration-500 scale-85 relative z-10">
                    <div className="text-center mb-10">
                        <div className="inline-block p-5 rounded-2xl bg-card shadow-xl mb-6 transform rotate-3 border border-border">
                            <UtensilsCrossed size={40} className="text-primary" />
                        </div>
                        <h1 className="text-4xl font-black mb-3 tracking-tight">{restaurant?.name}</h1>
                        <p className="text-muted-foreground text-lg">Welcome! Please enter your details to start ordering.</p>
                    </div>

                    <form onSubmit={handleStartSession} className="w-full space-y-5 bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Your Name</label>
                            <input name="name" required className="w-full p-4 rounded-xl border border-input bg-secondary/50 focus:bg-background transition-all focus:ring-2 ring-primary/20 outline-none" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 text-foreground/80">Phone Number</label>
                            <input name="phone" type="tel" required className="w-full p-4 rounded-xl border border-input bg-secondary/50 focus:bg-background transition-all focus:ring-2 ring-primary/20 outline-none" placeholder="9876543210" />
                        </div>
                        <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all mt-4">
                            Start Ordering
                        </button>
                    </form>
                    <p className="text-center text-xs text-muted-foreground mt-8">
                        By continuing, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        )
    }

    // Main App
    const allPaid = activeOrders.length > 0 && activeOrders.every(o => o.status === 'PAID' || o.paymentStatus === 'PAID');

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* App Navbar */}
            <CustomerNavbar restaurant={restaurant} table={table} customerName={customerInfo.name} />

            {/* Banner for All Paid */}
            {allPaid && (
                <div className="bg-emerald-600 text-white px-4 py-3 text-center text-sm font-bold shadow-md sticky top-[60px] z-30 animate-in slide-in-from-top-full">
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Payment Received. Thank you!</span>
                    </div>
                </div>
            )}

            {/* Restaurant Closed Banner */}
            {restaurant && (!restaurant.isOpen || !restaurant.isActive) && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl max-w-md text-center">
                        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Service Unavailable</h2>
                        <p className="text-muted-foreground mb-6">
                            {restaurant.name} is currently closed or not accepting orders. Please check back later.
                        </p>
                        <button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold">
                            Refresh Status
                        </button>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="relative h-48 w-full bg-slate-900 shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                <img
                    src={restaurant.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"}
                    alt="Restaurant"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />

                <div className="absolute bottom-0 left-0 w-full p-5 z-20 text-white">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl font-bold mb-1 tracking-tight">{restaurant.name}</h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium opacity-90">
                            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs uppercase tracking-wider">Table {table?.tableNumber}</span>
                            {restaurant.address?.locationUrl ? (
                                <a
                                    href={restaurant.address.locationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-sunset transition-colors hover:underline"
                                >
                                    <MapPin size={12} /> {restaurant.address?.city || 'City'}
                                </a>
                            ) : (
                                <span className="flex items-center gap-1"><MapPin size={12} /> {restaurant.address?.city || 'City'}</span>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Navigation Tabs - Sticky */}
            <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
                <div className="flex">
                    <button
                        onClick={() => setViewMode("MENU")}
                        className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all relative ${viewMode === 'MENU' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Menu
                        {viewMode === 'MENU' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    <button
                        onClick={() => setViewMode("TRACKER")}
                        className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all relative ${viewMode === 'TRACKER' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        My Orders
                        {activeOrders.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full align-middle">{activeOrders.length}</span>
                        )}
                        {viewMode === 'TRACKER' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative pb-24">
                <AnimatePresence mode="wait">
                    {viewMode === "MENU" ? (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="container mx-auto"
                        >
                            <Menu
                                menu={restaurant.menu || []}
                                addToCart={addToCart}
                                removeFromCart={removeFromCart}
                                cartItems={cart}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tracker"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="container mx-auto p-4"
                        >
                            {activeOrders.length === 0 ? (
                                <div className="text-center py-20 opacity-60">
                                    <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-xl font-bold mb-2">No active orders</h3>
                                    <p className="text-muted-foreground mb-6">Start adding delicious items from the menu!</p>
                                    <button
                                        onClick={() => setViewMode("MENU")}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold shadow-lg"
                                    >
                                        Go to Menu
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-lg mx-auto">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold">Current Session</h2>
                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                            {customerInfo.name ? `Guest: ${customerInfo.name}` : 'Guest'}
                                        </span>
                                    </div>

                                    {activeOrders.map((order, idx) => (
                                        <motion.div
                                            key={order._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <div className="flex items-center gap-2 mb-2 px-1">
                                                <Clock size={12} className="text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <OrderTracker order={order} />
                                        </motion.div>
                                    ))}

                                    {/* Bill Summary */}
                                    <div className="mt-8 bg-card rounded-2xl p-6 shadow-sm border border-border">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <ShoppingBag size={18} /> Bill Summary
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Orders Total ({activeOrders.length})</span>
                                                <span>₹{activeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Taxes & Charges (5%)</span>
                                                <span>₹{Math.round(activeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0) * 0.05)}</span>
                                            </div>
                                            <div className="border-t border-dashed border-border pt-3 mt-2 flex justify-between text-xl font-black text-foreground">
                                                <span>Total Payable</span>
                                                <span>₹{Math.round(activeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0) * 1.05)}</span>
                                            </div>
                                        </div>
                                        {!allPaid && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post(`${API_URL}/restaurants/public/${restroId}/table/${tableId}/bill`, { active: true });
                                                        alert("Bill requested! A waiter will be with you shortly.");
                                                        setTable(prev => ({ ...prev, requestBill: true }));
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Failed to request bill");
                                                    }
                                                }}
                                                disabled={table?.requestBill}
                                                className={`w-full mt-6 py-3.5 rounded-xl font-bold shadow-lg transition-all 
                                                        ${table?.requestBill
                                                        ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                                                        : 'bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-primary/20'}`}
                                            >
                                                {table?.requestBill ? "Bill Requested" : "Request Bill"}
                                            </button>
                                        )}
                                    </div>

                                    {allPaid && (
                                        <div className="mt-4 p-4 bg-emerald-100 text-emerald-800 rounded-xl text-center font-bold">
                                            Session Paid. Waiting for waiter to close session.
                                        </div>
                                    )}

                                    <div className="bg-secondary/30 rounded-xl p-6 text-center mt-8 border border-dashed border-border">
                                        <p className="font-medium text-sm text-foreground mb-2">Need anything else?</p>
                                        <button
                                            onClick={() => setViewMode("MENU")}
                                            className="text-primary font-bold text-sm hover:underline"
                                        >
                                            Browse Menu
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cart Component */}
            {viewMode === "MENU" && (
                <Cart
                    items={Object.values(cart)}
                    updateQuantity={updateQuantity}
                    handlePlaceOrder={handlePlaceOrder}
                    onClear={() => setCart({})}
                    defaultName={customerInfo.name}
                    defaultPhone={customerInfo.phone}
                />
            )}

            {/* Call Waiter FAB */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                    const newState = !table?.requestService;
                    // Optimistic update
                    setTable(prev => ({ ...prev, requestService: newState }));

                    try {
                        await axios.post(`${API_URL}/restaurants/public/${restroId}/table/${tableId}/service`, { active: newState });
                        // Success - user feedback provided by UI state
                    } catch (err) {
                        console.error("Failed to call waiter", err);

                        // Revert Optimistic Update
                        setTable(prev => ({ ...prev, requestService: !newState }));

                        // Handle 503 explicitly
                        if (err.response && err.response.status === 503) {
                            alert(err.response.data.message || "We are currently not serving (No Waiters Online).");
                        } else {
                            alert("Failed to update request. Please try again.");
                        }
                    }
                }}
                className={`fixed bottom-24 right-4 z-40 p-3 rounded-full shadow-lg flex items-center justify-center transition-colors ${table?.requestService ? 'bg-yellow-500 text-white animate-pulse' : 'bg-white text-yellow-500 border border-yellow-200'}`}
            >
                {table?.requestService ? <UtensilsCrossed size={24} /> : <div className="flex flex-col items-center"><span className="text-[10px] font-bold">Call</span><span className="text-[10px] font-bold">Waiter</span></div>}
            </motion.button>
        </div>
    );
}
