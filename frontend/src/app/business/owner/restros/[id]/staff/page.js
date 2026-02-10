"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useRestaurantStore from "@/store/useRestaurantStore";
import {
    Users, Plus, Trash2, Clock, Mail, Shield,
    Loader2, X, CheckCircle, MoreVertical, Key,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";

const StaffCard = ({ staff, onRemove, onChangePassword }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Calculate Active Status dynamically
    // Use the database status (toggle) instead of shift time
    const active = staff.isActive;

    const staffName = staff.user?.name || "Unknown Staff";
    const staffEmail = staff.user?.email || "No Email";
    const staffId = staff.user?._id || staff.user; // Handle populated or unpopulated user

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card text-card-foreground rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground uppercase">
                            {staffName.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${active ? 'bg-green-500' : 'bg-gray-400'}`} title={active ? "On Shift" : "Off Shift"}></div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{staffName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${staff.role === 'manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            staff.role === 'kitchen' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                            {staff.role}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                    >
                        <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-20 overflow-hidden"
                                >
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onChangePassword(staff); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 flex items-center gap-2"
                                    >
                                        <Key size={16} /> Change Password
                                    </button>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onRemove(staffId); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 flex items-center gap-2"
                                    >
                                        <Trash2 size={16} /> Remove Staff
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span className="truncate">{staffEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span className={active ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                        {staff.shift?.start || "09:00"} - {staff.shift?.end || "17:00"}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const AddStaffModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "waiter",
        shiftStart: "09:00",
        shiftEnd: "17:00"
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "waiter",
                shiftStart: "09:00",
                shiftEnd: "17:00"
            });
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await onSubmit(formData);
        } catch (err) {
            setError(err.message || "Failed to add staff member");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-background text-foreground w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
                    <h3 className="font-bold text-lg">Add New Staff</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4" autoComplete="off">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2"
                        >
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            name="name" required
                            autoComplete="off"
                            value={formData.name} onChange={handleChange}
                            className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email (Login ID)</label>
                        <input
                            type="email" name="email" required
                            autoComplete="off"
                            value={formData.email} onChange={handleChange}
                            className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="staff@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password" name="password" required minLength={6}
                            autoComplete="new-password"
                            value={formData.password} onChange={handleChange}
                            className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="******"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select
                            name="role"
                            value={formData.role} onChange={handleChange}
                            className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                        >
                            <option value="manager">Manager</option>
                            <option value="waiter">Waiter</option>
                            <option value="kitchen">Kitchen Staff</option>
                            <option value="staff">Other Staff</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Shift Start</label>
                            <input
                                type="time" name="shiftStart"
                                value={formData.shiftStart} onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Shift End</label>
                            <input
                                type="time" name="shiftEnd"
                                value={formData.shiftEnd} onChange={handleChange}
                                className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-white bg-sunset rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            Create Account
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, isLoading, staffName }) => {
    // ... no change needed in modal internal logic ...
    const [newPassword, setNewPassword] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(newPassword);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-background text-foreground w-full max-w-sm rounded-xl shadow-2xl border border-border overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
                    <h3 className="font-bold text-lg">Change Password</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Update password for <span className="font-semibold text-foreground">{staffName}</span>.
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password" required minLength={6}
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-secondary/50 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="Min 6 characters"
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-bold text-white bg-sunset rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            Update
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default function StaffPage() {
    const params = useParams();
    const restaurantId = params.id;

    // Get restaurant data (which already includes staff) - no separate fetch needed!
    const { restaurants, addStaffMember, removeStaffMember, updateStaffPassword, fetchRestaurantById } = useRestaurantStore();
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // Socket Listener for Realtime Staff Status
    useEffect(() => {
        if (!restaurantId) return;

        const socket = getSocket();
        socket.emit("join_staff_room", restaurantId);

        const handleStaffUpdate = (data) => {
            // Refetch to update UI
            fetchRestaurantById(restaurantId);
        };

        socket.on("staff_update", handleStaffUpdate);

        return () => {
            socket.off("staff_update", handleStaffUpdate);
        };
    }, [restaurantId, fetchRestaurantById]);

    // Get staff from restaurant object (already fetched by layout)
    const currentStaff = currentRestaurant?.staff || [];

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null); // This is the staff OBJECT { user: {}, role: ... }
    const [operationLoading, setOperationLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleAddStaff = async (data) => {
        setOperationLoading(true);
        try {
            await addStaffMember(params.id, data);
            setIsAddModalOpen(false);
            showSuccess("Staff member added successfully");
        } catch (err) {
            // Re-throw so modal can catch and show error inline
            throw err;
        } finally {
            setOperationLoading(false);
        }
    };

    const handleRemoveStaff = async (staffId) => {
        // staffId passed here is User ID from StaffCard
        if (!confirm("Are you sure you want to remove this staff member? This will delete their account permanently.")) return;

        try {
            await removeStaffMember(params.id, staffId);
            showSuccess("Staff member removed successfully");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleChangePassword = (staff) => {
        // Here we handle staff object (nested)
        setSelectedStaff(staff);
        setIsPasswordModalOpen(true);
    };

    const handleSubmitPasswordChange = async (newPassword) => {
        if (!selectedStaff) return;
        const staffUserId = selectedStaff.user?._id || selectedStaff.user;

        setOperationLoading(true);
        try {
            await updateStaffPassword(params.id, staffUserId, newPassword);
            setIsPasswordModalOpen(false);
            setSelectedStaff(null);
            showSuccess("Password updated successfully");
        } catch (err) {
            alert(err.message);
        } finally {
            setOperationLoading(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="text-sunset" /> Staff Management
                    </h2>
                    <p className="text-muted-foreground text-sm">Manage your team, roles, and shift timings.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto"
                >
                    <Plus size={18} />
                    Add New Staff
                </button>
            </div>

            {successMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-4 rounded-lg text-sm font-medium flex items-center gap-2">
                    <CheckCircle size={16} /> {successMsg}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {currentStaff.map((staff) => (
                        <StaffCard
                            key={staff._id}
                            staff={staff}
                            onRemove={handleRemoveStaff}
                            onChangePassword={handleChangePassword}
                        />
                    ))}
                </AnimatePresence>

                {currentStaff.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
                        <Users size={48} className="mb-4 opacity-50" />
                        <p className="font-medium">No staff members yet</p>
                        <p className="text-sm">Click "Add New Staff" to get started</p>
                    </div>
                )}
            </div>

            <AddStaffModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddStaff}
                isLoading={operationLoading}
            />

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handleSubmitPasswordChange}
                isLoading={operationLoading}
                staffName={selectedStaff?.user?.name || selectedStaff?.name || "Staff Member"}
            />
        </div>
    );
}
