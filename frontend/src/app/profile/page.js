"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import Navbar from "@/components/Navbar";
import { User, Mail, Phone, Calendar, Edit2, Save, X, Loader2, Utensils } from "lucide-react";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL) + "/api";

export default function ProfilePage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || ""
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`${API_URL}/auth/profile`, formData, { withCredentials: true });
            window.location.reload();
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
            setEditing(false);
        }
    };

    if (authLoading) {
        return (
            <>
                <Navbar />
                <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user?.name || "User"}</h1>
                                <p className="text-gray-600 dark:text-gray-400">Manage your account</p>
                            </div>
                            {!editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Edit2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Personal Information</h2>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        <span className="font-medium text-gray-900 dark:text-white">{user?.name || "Not set"}</span>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">{user?.email || "Not set"}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                {editing ? (
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        <span className="font-medium text-gray-900 dark:text-white">{user?.phone || "Not set"}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Account Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Member Since</div>
                                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "N/A"}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Account Type</div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {user?.roles?.includes('owner') ? 'Restaurant Owner' : 'Customer'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        {editing && (
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            name: user?.name || "",
                                            email: user?.email || "",
                                            phone: user?.phone || ""
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                            href="/bookings"
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white mb-1">My Bookings</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">View reservations</div>
                                </div>
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </a>

                        <a
                            href="/restaurants"
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white mb-1">Restaurants</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Explore dining</div>
                                </div>
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <Utensils className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
