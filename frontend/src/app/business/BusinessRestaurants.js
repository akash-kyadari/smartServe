"use client";

import React, { useState, useEffect } from "react";
import { Plus, MapPin, Phone, Clock, Utensils, Check, X, Loader2, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import useRestaurantStore from "@/store/useRestaurantStore";

export default function BusinessRestaurants() {
    const { user, isAuthenticated } = useAuthStore();
    const { restaurants, isLoading, fetchRestaurants, addRestaurant } = useRestaurantStore();
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        addressStreet: "",
        addressCity: "",
        addressState: "",
        addressPincode: "",
        gmapLink: "",
        contact: "",
        type: "fine-dining",
        noOfTables: "",
        startTime: "",
        endTime: "",
        ac: true
    });

    const [validationErrors, setValidationErrors] = useState({});

    // helpers for time parsing/formatting
    const parseTimeToMinutes = (t) => {
        // expect t in HH:MM (24h) format
        if (!t) return null;
        const parts = t.split(":");
        if (parts.length !== 2) return null;
        const hh = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        return hh * 60 + mm;
    };

    const formatTime12 = (t) => {
        // convert HH:MM -> h:MM AM/PM, if t already contains AM/PM return as-is
        if (!t) return "";
        if (/am|pm/i.test(t)) return t;
        const mins = parseTimeToMinutes(t);
        if (mins === null) return t;
        let hh = Math.floor(mins / 60);
        const mm = mins % 60;
        const period = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        if (hh === 0) hh = 12;
        return `${hh}:${String(mm).padStart(2, '0')} ${period}`;
    };

    const formatTimingsForDisplay = (timings) => {
        if (!timings) return '';
        // expect formats like 'HH:MM - HH:MM' or already friendly text
        const parts = timings.split('-').map(p => p.trim());
        if (parts.length === 2) {
            return `${formatTime12(parts[0])} - ${formatTime12(parts[1])}`;
        }
        return timings;
    };



    useEffect(() => {
        if (isAuthenticated) fetchRestaurants();
    }, [isAuthenticated]);

    const handleCreate = async (e) => {
        e.preventDefault();

        // client-side validation
        const errors = {};
        const tables = String(formData.noOfTables).trim();
        const contactDigits = String(formData.contact).replace(/\D/g, '');

        // name validation: at least 6 chars
        if (!formData.name || !formData.name.trim() || formData.name.trim().length < 6) {
            errors.name = "Please provide a restaurant name (at least 6 characters).";
        }

        if (!/^[0-9]+$/.test(tables) || Number(tables) < 1) {
            errors.noOfTables = "Please enter a valid number of tables (>= 1).";
        }

        // require exactly 10 digits for mobile
        if (!/^[0-9]{10}$/.test(contactDigits)) {
            errors.contact = "Enter a valid 10-digit mobile number.";
        }

        // address: require at least street + city + state
        if (!formData.addressStreet.trim() || !formData.addressCity.trim() || !formData.addressState.trim()) {
            errors.address = "Please provide street, city and state for the address.";
        }

        // timings: require valid start and end times and start < end
        const start = formData.startTime;
        const end = formData.endTime;
        const startM = parseTimeToMinutes(start);
        const endM = parseTimeToMinutes(end);
        if (!start || !end || startM === null || endM === null) {
            errors.timings = "Please provide both start and end times.";
        } else if (startM >= endM) {
            errors.timings = "End time must be after start time.";
        }

        if (Object.keys(errors).length) {
            setValidationErrors(errors);
            return;
        }

        setIsCreating(true);
        setValidationErrors({});

        const addressParts = [formData.addressStreet.trim(), formData.addressCity.trim(), formData.addressState.trim(), formData.addressPincode.trim()].filter(Boolean);
        const addressCombined = addressParts.join(', ');

        const timingsCombined = `${formData.startTime} - ${formData.endTime}`;

        const payload = {
            name: formData.name,
            address: addressCombined,
            gmapLink: formData.gmapLink || undefined,
            contact: contactDigits,
            type: formData.type,
            noOfTables: Number(tables),
            timings: timingsCombined,
            // include 12-hour formatted times for display/storage if backend wants them
            startTime12: formatTime12(formData.startTime),
            endTime12: formatTime12(formData.endTime),
            ac: Boolean(formData.ac)
        };

        try {
            await addRestaurant(payload);
            setShowModal(false);
            setFormData({
                name: "",
                addressStreet: "",
                addressCity: "",
                addressState: "",
                addressPincode: "",
                gmapLink: "",
                contact: "",
                type: "fine-dining",
                noOfTables: "",
                startTime: "",
                endTime: "",
                ac: true
            });
        } catch (error) {
            console.error("Error creating restaurant", error);
            alert(error.message || "Failed to create restaurant");
        } finally {
            setIsCreating(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-slate-800 text-center">
                    <Store size={40} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Owner access required</h3>
                    <p className="text-gray-500 mb-4">Please log in to manage your restaurants.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Restaurants</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your outlets and settings.</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-gray-900 dark:bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    <span>Add Restaurant</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            ) : restaurants.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
                        <Store size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No restaurants yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">Create your first restaurant profile to start managing menus and staff.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-sunset font-semibold hover:underline"
                    >
                        Create one now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.map((restro) => (
                        <div key={restro._id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-800 group hover:border-sunset/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{restro.name}</h3>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                                        {restro.type}
                                    </span>
                                </div>
                                <div className={`h-2 w-2 rounded-full ${restro.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin size={16} className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{restro.address}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock size={16} />
                                    <span>{formatTimingsForDisplay(restro.timings)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <Phone size={16} />
                                    <span>{restro.contact || 'No contact info'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <span className="flex items-center gap-1"><Utensils size={14} /> {restro.noOfTables} Tables</span>
                                    {restro.ac && <span className="flex items-center gap-1 text-blue-500"><Check size={14} /> AC</span>}
                                </div>
                                <Link
                                    href={`/business/restros/${restro._id}`}
                                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-sunset transition-colors"
                                >
                                    Manage &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Restaurant</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="create-restro-form" onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Restaurant Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full px-4 py-2 rounded-lg border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all`}
                                            placeholder="e.g. The Golden Spoon"
                                        />
                                        {validationErrors.name && (
                                            <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            <input
                                                required
                                                type="text"
                                                value={formData.addressStreet}
                                                onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                placeholder="Street, building, landmark"
                                            />

                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.addressCity}
                                                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                    placeholder="City"
                                                />
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.addressState}
                                                    onChange={(e) => setFormData({ ...formData, addressState: e.target.value })}
                                                    className={`w-full px-4 py-2 rounded-lg border ${validationErrors.address ? 'border-red-500' : 'border-gray-300'} dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all`}
                                                    placeholder="State / Region"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={formData.addressPincode}
                                                    onChange={(e) => setFormData({ ...formData, addressPincode: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                    placeholder="Postal code (optional)"
                                                />
                                                <input
                                                    type="url"
                                                    value={formData.gmapLink}
                                                    onChange={(e) => setFormData({ ...formData, gmapLink: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                    placeholder="Google Maps link (optional)"
                                                />
                                            </div>

                                            {validationErrors.address && (
                                                <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                                            <input
                                                type="tel"
                                                inputMode="tel"
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/[^0-9]/g, '') })}
                                                maxLength={10}
                                                className={`w-full px-4 py-2 rounded-lg border ${validationErrors.contact ? 'border-red-500' : 'border-gray-300'} dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all`}
                                                placeholder="Digits only, e.g. 9812345678"
                                            />
                                            {validationErrors.contact && (
                                                <p className="text-sm text-red-500 mt-1">{validationErrors.contact}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuisine/Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                            >
                                                <option value="fine-dining">Fine Dining</option>
                                                <option value="cafe">Cafe</option>
                                                <option value="casual">Casual Dining</option>
                                                <option value="pub">Pub/Bar</option>
                                                <option value="fast-food">Fast Food</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. of Tables</label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                inputMode="numeric"
                                                value={formData.noOfTables}
                                                onChange={(e) => setFormData({ ...formData, noOfTables: e.target.value.replace(/[^0-9]/g, '') })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                placeholder="Total count"
                                            />
                                            {validationErrors.noOfTables && (
                                                <p className="text-sm text-red-500 mt-1">{validationErrors.noOfTables}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timings (Start & End)</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <input
                                                        required
                                                        type="time"
                                                        value={formData.startTime}
                                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                        className={`w-full px-4 py-2 rounded-lg border ${validationErrors.timings ? 'border-red-500' : 'border-gray-300'} dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all`}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">{formData.startTime ? formatTime12(formData.startTime) : 'Start time'}</p>
                                                </div>

                                                <div>
                                                    <input
                                                        required
                                                        type="time"
                                                        value={formData.endTime}
                                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                        className={`w-full px-4 py-2 rounded-lg border ${validationErrors.timings ? 'border-red-500' : 'border-gray-300'} dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all`}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">{formData.endTime ? formatTime12(formData.endTime) : 'End time'}</p>
                                                </div>
                                            </div>
                                            {validationErrors.timings && (
                                                <p className="text-sm text-red-500 mt-1">{validationErrors.timings}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="ac-check"
                                            checked={formData.ac}
                                            onChange={(e) => setFormData({ ...formData, ac: e.target.checked })}
                                            className="w-4 h-4 text-sunset rounded border-gray-300 focus:ring-sunset"
                                        />
                                        <label htmlFor="ac-check" className="text-sm font-medium text-gray-700 dark:text-gray-300">Air Conditioned</label>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-restro-form"
                                    disabled={isCreating}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-sunset hover:opacity-90 transition-opacity flex items-center gap-2"
                                >
                                    {isCreating && <Loader2 size={16} className="animate-spin" />}
                                    Create Restaurant
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
