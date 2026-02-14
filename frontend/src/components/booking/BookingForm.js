"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = (process.env.NEXT_PUBLIC_API_URL) + "/api";

export default function BookingForm({ restaurantId, tables, onClose }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '',
        guests: 2,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Generate Time Slots (e.g., 10:00 to 22:00, 30 min intervals)
    // In real app, fetch available slots from backend
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 11; i < 22; i++) {
            slots.push(`${i}:00`);
            slots.push(`${i}:30`);
        }
        return slots;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Simple logic: Pick a table that fits guest count
            // In real app, backend assigns table or we show table map
            const suitableTable = tables?.find(t => t.capacity >= formData.guests && !t.isOccupied);
            // Note: Frontend doesn't know future occupancy, so backend will reject if conflict.
            // We just send a suitable tableId candidates or let backend logic handle assignment?
            // Backend `createBooking` expects `tableId`. 
            // We should filter tables by capacity.

            if (!suitableTable) {
                throw new Error("No suitable table found for this party size.");
            }

            // We try to book the first suitable table. 
            // If backend rejects (conflict), we could try next table? 
            // For now, simple implementation:

            await axios.post(`${API_URL}/bookings`, {
                restaurantId,
                tableId: suitableTable._id,
                date: formData.date,
                startTime: formData.time,
                guestCount: formData.guests,
                notes: formData.notes
            }, { withCredentials: true });

            setSuccess(true);
            setTimeout(() => onClose && onClose(), 2000);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to book table");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center p-8 bg-green-50 rounded-xl">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-4 bg-green-100 rounded-full text-green-600 mb-4">
                    <CheckCircle size={48} />
                </motion.div>
                <h3 className="text-2xl font-bold text-green-800">Booking Confirmed!</h3>
                <p className="text-green-600 mt-2">See you soon!</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Details */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-muted-foreground" size={18} />
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-sunset outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Guests</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <input
                                type="number"
                                min="1" max="20"
                                required
                                value={formData.guests}
                                onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-sunset outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 text-muted-foreground" size={18} />
                            <select
                                required
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-sunset outline-none appearance-none"
                            >
                                <option value="">Select Time</option>
                                {generateTimeSlots().map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Special Request (Optional)</label>
                    <textarea
                        rows="2"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-sunset outline-none resize-none"
                        placeholder="Birthday, Anniversary, etc."
                    />
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2"
                    >
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-sunset hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Confirm Reservation"}
            </button>
        </form>
    );
}
