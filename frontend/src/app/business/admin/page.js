"use client";

import React, { useState, useEffect } from "react";
import { Plus, MapPin, Phone, Clock, Utensils, Users, Check, X, Loader2, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/store/useAuthStore";

const API_URL = 'http://localhost:3000/api';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        contact: "",
        type: "fine-dining",
        noOfTables: "",
        timings: "",
        ac: true
    });

    const fetchRestaurants = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/restaurants/my-restaurants`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                setRestaurants(data.restaurants || []);
            }
        } catch (error) {
            console.error("Failed to fetch restaurants", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/restaurants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({
                    name: "",
                    address: "",
                    contact: "",
                    type: "fine-dining",
                    noOfTables: "",
                    timings: "",
                    ac: true
                });
                fetchRestaurants();
            } else {
                alert("Failed to create restaurant");
            }
        } catch (error) {
            console.error("Error creating restaurant", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
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

            {/* Content */}
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
                                    <span>{restro.timings}</span>
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
                                <button className="text-sm font-semibold text-gray-900 dark:text-white hover:text-sunset transition-colors">
                                    Manage &rarr;
                                </button>
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
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                            placeholder="e.g. The Golden Spoon"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                        <textarea
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all h-20 resize-none"
                                            placeholder="Full business address"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                                            <input
                                                type="tel"
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                placeholder="+91..."
                                            />
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
                                                value={formData.noOfTables}
                                                onChange={(e) => setFormData({ ...formData, noOfTables: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                placeholder="Total count"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timings</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.timings}
                                                onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-sunset outline-none transition-all"
                                                placeholder="e.g. 10 AM - 11 PM"
                                            />
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
