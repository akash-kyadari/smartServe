"use client";
import { useState, useEffect } from "react";
import { ShoppingBag, X, Minus, Plus, CreditCard, User, ChevronRight, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart({ items, updateQuantity, handlePlaceOrder, onClear, defaultName = "", defaultPhone = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(defaultName);
    const [phone, setPhone] = useState(defaultPhone);

    useEffect(() => {
        if (defaultName) setName(defaultName);
        if (defaultPhone) setPhone(defaultPhone);
    }, [defaultName, defaultPhone]);

    const total = items.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    const count = items.reduce((acc, item) => acc + (item.quantity || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation for stock/availability
        const unavailableItems = items.filter(item => !item.isAvailable || (item.stock !== null && item.stock <= 0));

        if (unavailableItems.length > 0) {
            alert(`Please remove unavailable items: ${unavailableItems.map(i => i.name).join(', ')}`);
            return;
        }

        if (!name || !phone) {
            // Shake animation or toast could be added here
            alert("Please provide your Name and Phone to place order.");
            return;
        }
        handlePlaceOrder({ customerDetails: { name, phone } });
        setIsOpen(false);
    };

    if (count === 0 && !isOpen) return null;

    return (
        <>
            {/* Bottom Floating Bar (View Cart) */}
            <AnimatePresence>
                {!isOpen && count > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-4 left-3 right-3 z-50"
                    >
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 rounded-2xl p-3 flex items-center justify-between hover:bg-primary/90 transition-transform active:scale-[0.98] group"
                        >
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 font-bold w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm text-sm">
                                    {count}
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="font-bold text-sm">View Cart</span>
                                    <span className="text-[10px] opacity-80 font-medium uppercase tracking-wide">Checkout</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base">₹{total}</span>
                                <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Sheet Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl h-[85vh] flex flex-col overflow-hidden will-change-transform"
                        >
                            {/* Handle & Header */}
                            <div className="bg-background sticky top-0 z-10 p-2 text-center" onClick={() => setIsOpen(false)}>
                                <div className="w-12 h-1 bg-muted rounded-full mx-auto my-1" />
                            </div>

                            <div className="px-4 pb-2 border-b border-border flex justify-between items-center bg-background sticky top-4 z-10">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    Your Order
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold align-middle">{count} items</span>
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content Scroll */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                                {/* Items */}
                                <div className="space-y-3">
                                    {items.map((item) => {
                                        const maxReached = item.stock !== null && item.stock !== undefined && item.quantity >= item.stock;
                                        const isUnavailable = !item.isAvailable || (item.stock !== null && item.stock <= 0);

                                        return (
                                            <div key={item._id} className={`flex gap-3 items-center bg-card/50 p-2 rounded-xl border ${isUnavailable ? 'border-red-200 bg-red-50/50' : 'border-border/50'}`}>
                                                {/* Optional Image per item in cart? No, keep it compact */}
                                                <div className="w-10 h-10 rounded-lg bg-secondary shrink-0 overflow-hidden">
                                                    {item.image ? <img src={item.image} className={`w-full h-full object-cover ${isUnavailable ? 'opacity-50 grayscale' : ''}`} /> : null}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold text-sm truncate ${isUnavailable ? 'text-red-500 line-through' : 'text-foreground'}`}>{item.name}</p>
                                                    {!isUnavailable && <p className="text-xs text-primary font-bold">₹{item.price * item.quantity}</p>}

                                                    {isUnavailable ? (
                                                        <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                                                            <X size={10} /> Currently Unavailable
                                                        </span>
                                                    ) : maxReached ? (
                                                        <span className="text-[10px] text-amber-500 font-bold">Max stock reached</span>
                                                    ) : null}
                                                </div>

                                                <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-0.5 shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item, -1)}
                                                        className="w-6 h-6 flex items-center justify-center hover:bg-secondary rounded-md transition-colors text-foreground"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => !maxReached && !isUnavailable && updateQuantity(item, 1)}
                                                        disabled={maxReached || isUnavailable}
                                                        className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${maxReached || isUnavailable ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-secondary text-foreground'}`}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Guest Details */}
                                <div className="bg-secondary/20 rounded-xl p-4 border border-dashed border-border mt-4">
                                    <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User size={12} /> Guest Details
                                    </h3>
                                    <div className="space-y-2.5">
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="tel"
                                                placeholder="Mobile Number"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground px-1">* We use this to track your order.</p>
                                    </div>
                                </div>

                                <div className="h-16" /> {/* Spacer */}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 bg-background border-t border-border sticky bottom-0 z-10 pb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-muted-foreground font-medium">Grand Total</span>
                                    <span className="text-xl font-black text-foreground">₹{total}</span>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
                                >
                                    <span>Place Order</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
