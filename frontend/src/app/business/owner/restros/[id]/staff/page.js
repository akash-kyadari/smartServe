"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import useRestaurantStore from "@/store/useRestaurantStore";
import {
    Users, Plus, Trash2, Clock, Mail, Shield,
    Loader2, X, CheckCircle, MoreVertical, Key,
    AlertCircle, DollarSign, Utensils, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import socketService from "@/services/socketService";
import { toast } from "react-hot-toast";

const StaffCard = React.memo(({ staff, stats, onRemove, onChangePassword, onToggleStatus, showStats = true }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Calculate Active Status dynamically
    const active = staff.isActive;
    const staffName = staff.user?.name || "Unknown Staff";
    const staffEmail = staff.user?.email || "No Email";
    const staffId = staff.user?._id || staff.user;

    // Use default stats if not provided, memoized to prevent re-renders on every parent render if stats is improved
    const staffStats = stats || { activeTables: 0, todayOrders: 0, todaySales: 0 };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border ${active ? 'border-green-500/30 ring-1 ring-green-500/20' : 'border-gray-200 dark:border-slate-800'} hover:shadow-md transition-all relative`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground uppercase">
                            {staffName.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${active ? 'bg-green-500' : 'bg-gray-400'}`} title={active ? "On Shift" : "Off Shift"}></div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{staffName}</h3>
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
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
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
                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-20 overflow-hidden"
                                >
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onToggleStatus(staffId, !active, staffName); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2 ${active ? 'text-amber-600' : 'text-green-600'}`}
                                    >
                                        <Clock size={16} /> {active ? "Mark Offline" : "Mark Online"}
                                    </button>
                                    <button
                                        onClick={() => { setIsMenuOpen(false); onChangePassword(staff); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
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

            {/* Status Badge (Waiters only usually, but good for all) */}
            <div className="mb-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded border ${active
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                    : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700"
                    }`}>
                    {active ? "● Online & Receiving Orders" : "○ Offline"}
                </span>
            </div>

            <div className="space-y-4">
                <div className="space-y-2 text-sm text-gray-500">
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

                {/* Live Stats - CONDITIONAL */}
                {showStats && (
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1"><Utensils size={10} /> Active</div>
                            <div className="font-bold text-gray-900 dark:text-white">{staffStats.activeTables || 0}</div>
                        </div>
                        <div className="text-center border-l border-gray-100 dark:border-slate-800">
                            <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1"><CheckCircle size={10} /> Orders</div>
                            <div className="font-bold text-gray-900 dark:text-white">{staffStats.todayOrders || 0}</div>
                        </div>
                        <div className="text-center border-l border-gray-100 dark:border-slate-800">
                            <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1"><DollarSign size={10} /> Sales</div>
                            <div className="font-bold text-green-600 dark:text-green-400">${staffStats.todaySales || 0}</div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

// ... AddStaffModal and ChangePasswordModal components (keeping them as is but ensuring imports work)

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
                className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-lg">Add New Staff</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
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
                            className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email (Login ID)</label>
                        <input
                            type="email" name="email" required
                            autoComplete="off"
                            value={formData.email} onChange={handleChange}
                            className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="staff@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password" name="password" required minLength={6}
                            autoComplete="new-password"
                            value={formData.password} onChange={handleChange}
                            className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="******"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select
                            name="role"
                            value={formData.role} onChange={handleChange}
                            className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
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
                                className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Shift End</label>
                            <input
                                type="time" name="shiftEnd"
                                value={formData.shiftEnd} onChange={handleChange}
                                className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-lg">Change Password</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Update password for <span className="font-semibold text-gray-900 dark:text-white">{staffName}</span>.
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password" required minLength={6}
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-sunset rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                            placeholder="Min 6 characters"
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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

    // Get restaurant data
    // Get restaurant data
    const {
        restaurants,
        addStaffMember,
        removeStaffMember,
        updateStaffPassword,
        toggleStaffStatus,
        setStaffActiveStatus, // New action
        fetchRestaurantById,
        dashboardData, // Access store data
        setDashboardData // Access setter
    } = useRestaurantStore();
    const currentRestaurant = restaurants.find(r => r._id === restaurantId);

    // State for analytics - Initialize from store if available
    const storedStats = dashboardData[restaurantId]?.staffStats;
    const [stats, setStats] = useState(storedStats || {
        totalStaff: 0,
        activeStaff: 0,
        activeTables: 0,
        todaySales: 0,
        staffPerformance: {} // Map of staffId -> { activeTables, todayOrders, todaySales }
    });

    // Fetch detailed staff analytics
    const fetchAnalytics = useCallback(async (force = false, signal) => {
        if (!restaurantId) return;

        // Cache check
        const cached = useRestaurantStore.getState().dashboardData[restaurantId]?.staffStats;
        if (!force && cached) {
            console.log("Using cached staff stats");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurants/${restaurantId}/staff/analytics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                signal
            });
            const data = await response.json();
            if (data.success) {
                // ... logic
                // Transform array to map for easier lookup by staff ID
                const performanceMap = {};
                if (data.staffPerformance) {
                    data.staffPerformance.forEach(p => {
                        performanceMap[p.staffId] = p;
                    });
                }

                const newStats = {
                    totalStaff: data.totalStaff || 0,
                    activeStaff: data.activeStaff || 0,
                    activeTables: data.activeTables || 0,
                    todaySales: data.todaySales || 0,
                    staffPerformance: performanceMap
                };

                setStats(newStats);
                setDashboardData(restaurantId, { staffStats: newStats });
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error("Failed to fetch staff analytics", error);
        }
    }, [restaurantId, setDashboardData]);

    // Initial Fetch
    useEffect(() => {
        const controller = new AbortController();
        fetchAnalytics(false, controller.signal);

        // Also fetch restaurant data if missing
        if (!currentRestaurant) {
            fetchRestaurantById(restaurantId);
        }

        return () => controller.abort();
    }, [fetchAnalytics, restaurantId, currentRestaurant, fetchRestaurantById]);

    // Socket Listeners for Realtime Updates
    useEffect(() => {
        if (!restaurantId) return;

        const socket = socketService.connect();
        socketService.joinStaffRoom(restaurantId, "owner"); // Join as owner/manager

        const handleStaffUpdate = (data) => {
            console.log("Socket: staff_update received", data);
            // Optimistic update without refetch
            if (data && data.staffId) {
                setStaffActiveStatus(restaurantId, data.staffId, data.isActive);
            }
        };

        const handleStatsUpdate = () => {
            console.log("Socket: stats related update received, fetching analytics...");
            fetchAnalytics(true);
            // We might want to fetch restaurant data periodically or on specific events, 
            // but for stats, analytics endpoint is enough.
        };

        const handleFullRefresh = () => {
            fetchRestaurantById(restaurantId);
        };

        // Listen for events
        socket.on("staff_update", handleStaffUpdate); // Only local update
        socket.on("new_order", handleStatsUpdate);
        socket.on("order_update", handleStatsUpdate);
        socket.on("table_freed", handleStatsUpdate);

        return () => {
            socket.off("staff_update", handleStaffUpdate);
            socket.off("new_order", handleStatsUpdate);
            socket.off("order_update", handleStatsUpdate);
            socket.off("table_freed", handleStatsUpdate);
        };
    }, [restaurantId, fetchAnalytics, setStaffActiveStatus, fetchRestaurantById]);


    // Get staff from restaurant object
    const currentStaff = currentRestaurant?.staff || [];

    // Separate Staff
    const waiters = currentStaff.filter(s => s.role === 'waiter');
    const kitchenStaff = currentStaff.filter(s => s.role === 'kitchen');
    const otherStaff = currentStaff.filter(s => !['waiter', 'kitchen'].includes(s.role));


    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [operationLoading, setOperationLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleAddStaff = async (data) => {
        setOperationLoading(true);
        try {
            await addStaffMember(params.id, data);
            setIsAddModalOpen(false);
            showSuccess("Staff member added successfully");
            fetchAnalytics(); // Update count
        } catch (err) {
            throw err;
        } finally {
            setOperationLoading(false);
        }
    };

    const handleRemoveStaff = async (staffId) => {
        if (!confirm("Are you sure you want to remove this staff member? This will delete their account permanently.")) return;

        try {
            await removeStaffMember(params.id, staffId);
            showSuccess("Staff member removed successfully");
            fetchAnalytics(); // Update count
        } catch (err) {
            alert(err.message);
        }
    };

    const handleChangePassword = (staff) => {
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

    const handleToggleStatus = async (staffId, newStatus, staffName) => {
        const action = newStatus ? "Mark Online" : "Mark Offline";
        if (!confirm(`Are you sure you want to ${action} for ${staffName}?`)) return;

        try {
            await toggleStaffStatus(params.id, staffId, newStatus);
            showSuccess(`Staff status updated successfully`);
            fetchAnalytics();
        } catch (err) {
            alert(err.message);
        }
    };

    const showSuccess = (msg) => {
        toast.success(msg);
        setSuccessMsg(msg); // For inline alert if needed
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-sunset" /> Staff Management
                    </h2>
                    <p className="text-gray-500 text-sm">Manage team, roles, shift timings, and view real-time performance.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto"
                >
                    <Plus size={18} />
                    Add New Staff
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm text-gray-500">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStaff}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm text-gray-500">Online Now</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeStaff}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm text-gray-500">Active Tables</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.activeTables}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm text-gray-500">Today's Team Sales</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.todaySales}</p>
                </div>
            </div>

            {/* Staff Sections */}
            <div className="space-y-8">

                {/* Waiters */}
                {waiters.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-500" />
                            Waiter Staff
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {waiters.map((staff) => {
                                    const staffId = staff.user?._id || staff.user;
                                    const staffStat = stats.staffPerformance[staffId];
                                    return (
                                        <StaffCard
                                            key={staff._id}
                                            staff={staff}
                                            stats={staffStat}
                                            showStats={true}
                                            onRemove={handleRemoveStaff}
                                            onChangePassword={handleChangePassword}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Kitchen Staff */}
                {kitchenStaff.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Utensils size={20} className="text-orange-500" />
                            Kitchen Staff
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {kitchenStaff.map((staff) => {
                                    const staffId = staff.user?._id || staff.user;
                                    const staffStat = stats.staffPerformance[staffId];
                                    return (
                                        <StaffCard
                                            key={staff._id}
                                            staff={staff}
                                            stats={staffStat}
                                            showStats={false} // Hide stats for kitchen
                                            onRemove={handleRemoveStaff}
                                            onChangePassword={handleChangePassword}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {/* Management / Other */}
                {otherStaff.length > 0 && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-purple-500" />
                            Management & Others
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {otherStaff.map((staff) => {
                                    const staffId = staff.user?._id || staff.user;
                                    const staffStat = stats.staffPerformance[staffId];
                                    return (
                                        <StaffCard
                                            key={staff._id}
                                            staff={staff}
                                            stats={staffStat}
                                            showStats={true} // Show stats for managers if they take orders
                                            onRemove={handleRemoveStaff}
                                            onChangePassword={handleChangePassword}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </section>
                )}

                {currentStaff.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
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
