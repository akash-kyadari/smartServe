"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useRestaurantStore from "@/store/useRestaurantStore";
import useAuthStore from "@/store/useAuthStore";
import {
    Save, MapPin, Phone, Mail, Clock, LayoutGrid,
    CreditCard, Power, ShieldCheck, Loader2, Users, Plus, Trash2, Armchair
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const params = useParams();
    const { restaurants, updateRestaurant, fetchRestaurants } = useRestaurantStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const restaurant = restaurants.find((r) => r._id === params.id);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        gstNumber: "",
        phone: "",
        email: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        openTime: "",
        closeTime: "",
        isAC: false,
        isActive: true,
        allowTableBooking: true,
        allowQROrdering: true,
        acceptsOnline: true,
        acceptsCash: true,
    });

    const [tables, setTables] = useState([]);

    useEffect(() => {
        if (!restaurant && restaurants.length === 0) {
            fetchRestaurants();
        } else if (restaurant) {
            setFormData({
                name: restaurant.name || "",
                description: restaurant.description || "",
                gstNumber: restaurant.gstNumber || "",
                phone: restaurant.phone || "",
                email: restaurant.email || user?.email || "",
                street: restaurant.address?.street || "",
                city: restaurant.address?.city || "",
                state: restaurant.address?.state || "",
                pincode: restaurant.address?.pincode || "",
                openTime: restaurant.openingHours?.open || "10:00",
                closeTime: restaurant.openingHours?.close || "22:00",
                isAC: restaurant.isAC || false,
                isActive: restaurant.isActive !== undefined ? restaurant.isActive : true,
                allowTableBooking: restaurant.settings?.allowTableBooking !== undefined ? restaurant.settings.allowTableBooking : true,
                allowQROrdering: restaurant.settings?.allowQROrdering !== undefined ? restaurant.settings.allowQROrdering : true,
                acceptsOnline: restaurant.paymentSettings?.acceptsOnline !== undefined ? restaurant.paymentSettings.acceptsOnline : true,
                acceptsCash: restaurant.paymentSettings?.acceptsCash !== undefined ? restaurant.paymentSettings.acceptsCash : true,
            });
            setTables(restaurant.tables || []);
        }
    }, [restaurant, restaurants.length, fetchRestaurants, user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleTableChange = (index, field, value) => {
        const newTables = [...tables];
        newTables[index] = { ...newTables[index], [field]: value };
        setTables(newTables);
    };

    const addTable = () => {
        const lastTableNumber = tables.length > 0 ? tables[tables.length - 1].tableNumber : 0;
        setTables([...tables, {
            tableNumber: lastTableNumber + 1,
            capacity: 4,
            isOccupied: false
        }]);
        setSuccessMessage("Table added. Don't forget to save changes.");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const removeTable = () => {
        if (tables.length === 0) return;
        setTables(tables.slice(0, -1));
        setSuccessMessage("Table removed. Don't forget to save changes.");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const updates = {
            name: formData.name,
            description: formData.description,
            gstNumber: formData.gstNumber,
            phone: formData.phone,
            email: formData.email,
            address: {
                ...(restaurant?.address || {}), // Preserve existing fields like coordinates
                street: formData.street,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: "India"
            },
            openingHours: {
                open: formData.openTime,
                close: formData.closeTime,
                daysOpen: restaurant?.openingHours?.daysOpen || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            },
            isAC: formData.isAC,
            isActive: formData.isActive,
            settings: {
                allowTableBooking: formData.allowTableBooking,
                allowQROrdering: formData.allowQROrdering,
                autoAcceptOrders: restaurant?.settings?.autoAcceptOrders || false
            },
            paymentSettings: {
                acceptsOnline: formData.acceptsOnline,
                acceptsCash: formData.acceptsCash,
                serviceChargePercent: restaurant?.paymentSettings?.serviceChargePercent || 0,
                platformCommissionPercent: restaurant?.paymentSettings?.platformCommissionPercent || 0
            },
            tables: tables.map(t => ({
                ...t,
                capacity: Number(t.capacity) || 2
            }))
        };

        try {
            await updateRestaurant(params.id, updates);
            setSuccessMessage("Settings updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!restaurant) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-sunset" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Settings & Info</h2>
                    <p className="text-muted-foreground text-sm">Manage your restaurant details and configuration</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            {successMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2"
                >
                    <ShieldCheck size={18} />
                    {successMessage}
                </motion.div>
            )}

            {errorMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2"
                >
                    <Power size={18} className="rotate-45" />
                    {errorMessage}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Information */}
                <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                        <LayoutGrid size={18} className="text-sunset" /> General Information
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Restaurant Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">GST Number</label>
                            <input
                                name="gstNumber"
                                value={formData.gstNumber}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact & Location */}
                <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                        <MapPin size={18} className="text-sunset" /> Location & Contact
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Phone size={12} /> Phone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Mail size={12} /> Email</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium mb-1 block">Street Address</label>
                            <input
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">City</label>
                            <input
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">State</label>
                            <input
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Pincode</label>
                            <input
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Operations */}
                <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                        <Clock size={18} className="text-sunset" /> Operations
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Opening Time</label>
                            <input
                                type="time"
                                name="openTime"
                                value={formData.openTime}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Closing Time</label>
                            <input
                                type="time"
                                name="closeTime"
                                value={formData.closeTime}
                                onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-4 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="col-span-2 pt-2 space-y-3">
                            <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                                <span className="text-sm font-medium">Restaurant Active (Open/Closed)</span>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="accent-sunset w-5 h-5"
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                                <span className="text-sm font-medium">Air Conditioned (AC)</span>
                                <input
                                    type="checkbox"
                                    name="isAC"
                                    checked={formData.isAC}
                                    onChange={handleChange}
                                    className="accent-sunset w-5 h-5"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                        <ShieldCheck size={18} className="text-sunset" /> System Preferences
                    </h3>

                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                            <span className="text-sm font-medium">Allow Table Booking</span>
                            <input
                                type="checkbox"
                                name="allowTableBooking"
                                checked={formData.allowTableBooking}
                                onChange={handleChange}
                                className="accent-sunset w-5 h-5"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                            <span className="text-sm font-medium">Allow QR Ordering</span>
                            <input
                                type="checkbox"
                                name="allowQROrdering"
                                checked={formData.allowQROrdering}
                                onChange={handleChange}
                                className="accent-sunset w-5 h-5"
                            />
                        </label>
                        <div className="border-t border-border pt-3 mt-3">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CreditCard size={14} /> Payments</h4>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <span className="text-sm font-medium">Accept Online Payment</span>
                                    <input
                                        type="checkbox"
                                        name="acceptsOnline"
                                        checked={formData.acceptsOnline}
                                        onChange={handleChange}
                                        className="accent-sunset w-5 h-5"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <span className="text-sm font-medium">Accept Cash</span>
                                    <input
                                        type="checkbox"
                                        name="acceptsCash"
                                        checked={formData.acceptsCash}
                                        onChange={handleChange}
                                        className="accent-sunset w-5 h-5"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Management */}
                <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm space-y-4 md:col-span-2">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Armchair size={18} className="text-sunset" /> Table Management
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={removeTable}
                                disabled={tables.length === 0}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove last table"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={addTable}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center gap-1"
                                title="Add updated table"
                            >
                                <Plus size={18} /> <span className="text-sm font-medium">Add Table</span>
                            </button>
                        </div>
                    </div>

                    {tables.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No tables configured.</p>
                            <button onClick={addTable} className="text-sunset font-medium hover:underline mt-2">Add your first table</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {tables.map((table, index) => (
                                <div key={index} className="bg-secondary/30 p-4 rounded-xl border border-transparent hover:border-sunset/50 transition-all group">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-muted-foreground group-hover:text-sunset transition-colors">
                                            <span className="font-bold text-sm">T{table.tableNumber}</span>
                                        </div>

                                        <div className="w-full space-y-1">
                                            <label className="text-xs text-muted-foreground text-center block">Capacity</label>
                                            <div className="relative">
                                                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={table.capacity}
                                                    onChange={(e) => handleTableChange(index, "capacity", e.target.value === "" ? "" : parseInt(e.target.value))}
                                                    className="w-full bg-background pl-8 pr-2 py-1.5 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-sunset border border-border/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
