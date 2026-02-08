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
                        className="fixed bottom-6 left-4 right-4 z-50"
                    >
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 rounded-2xl p-4 flex items-center justify-between hover:bg-primary/90 transition-transform active:scale-[0.98] group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 font-bold w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    {count}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold text-base">View Cart</span>
                                    <span className="text-xs opacity-80 font-medium uppercase tracking-wide">Checkout</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">₹{total}</span>
                                <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
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
                            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl h-[90vh] flex flex-col overflow-hidden will-change-transform"
                        >
                            {/* Handle & Header */}
                            <div className="bg-background sticky top-0 z-10 p-2 text-center" onClick={() => setIsOpen(false)}>
                                <div className="w-16 h-1.5 bg-muted rounded-full mx-auto my-2" />
                            </div>

                            <div className="px-6 pb-4 border-b border-border flex justify-between items-center bg-background sticky top-6 z-10">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    Your Order
                                    <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full font-bold align-middle">{count} items</span>
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content Scroll */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {/* Items */}
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item._id} className="flex gap-4 items-center bg-card/50 p-3 rounded-2xl border border-border/50">
                                            {/* Optional Image per item in cart? No, keep it compact */}
                                            <div className="w-12 h-12 rounded-lg bg-secondary shrink-0 overflow-hidden">
                                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : null}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-foreground truncate">{item.name}</p>
                                                <p className="text-sm text-primary font-bold">₹{item.price * item.quantity}</p>
                                            </div>

                                            <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-1 shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item, -1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors text-foreground"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center tabular-nums">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item, 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors text-foreground"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Guest Details */}
                                <div className="bg-secondary/20 rounded-2xl p-5 border border-dashed border-border mt-6">
                                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <User size={14} /> Guest Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <input
                                                type="tel"
                                                placeholder="Mobile Number"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground px-1">* We use this to track your order.</p>
                                    </div>
                                </div>

                                <div className="h-20" /> {/* Spacer */}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 bg-background border-t border-border sticky bottom-0 z-10 pb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-muted-foreground font-medium">Grand Total</span>
                                    <span className="text-2xl font-black text-foreground">₹{total}</span>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
                                >
                                    <span>Place Order</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
