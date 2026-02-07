"use client";

import React from "react";
import useAuthStore from "@/store/useAuthStore";
import { User, Mail, Shield, Calendar, Edit2, Lock, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, logout } = useAuthStore();

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-sunset border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row gap-8 items-start"
            >
                {/* Profile Card */}
                <div className="w-full md:w-1/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-sunset to-orange-600 relative">
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                            <div className="h-24 w-24 rounded-full bg-white dark:bg-slate-900 p-1 shadow-lg">
                                <div className="h-full w-full rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                                    <User size={40} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-8 px-6 text-center space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-sm text-gray-500 font-medium capitalize flex items-center justify-center gap-1">
                            <Shield size={14} />
                            {user.role?.includes('owner') ? 'Business Owner' : user.role?.[0]}
                        </p>

                        <div className="pt-6 flex flex-col gap-3">
                            <button className="w-full py-2 px-4 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                <Edit2 size={16} />
                                Edit Profile
                            </button>
                            <button
                                onClick={() => logout()}
                                className="w-full py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 dark:border-red-900/30 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 w-full space-y-6">
                    {/* Account Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-sunset" />
                            Account Information
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                                    <div className="p-3 bg-secondary/50 rounded-lg text-sm font-medium border border-transparent hover:border-border transition-colors">
                                        {user.name}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                                    <div className="p-3 bg-secondary/50 rounded-lg text-sm font-medium border border-transparent hover:border-border transition-colors flex items-center gap-2">
                                        <Mail size={16} className="text-gray-400" />
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                                    <div className="p-3 bg-secondary/50 rounded-lg text-sm font-medium border border-transparent hover:border-border transition-colors flex items-center gap-2 capitalize">
                                        <Shield size={16} className="text-gray-400" />
                                        {user.role?.join(', ')}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account ID</label>
                                    <div className="p-3 bg-secondary/50 rounded-lg text-xs font-mono text-gray-500 border border-transparent hover:border-border transition-colors truncate">
                                        {user._id || user.id || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section (Placeholder) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6 opacity-75">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Lock size={20} className="text-sunset" />
                                Security
                            </h2>
                            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Secure</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">Password</p>
                                <p className="text-xs text-gray-500">Last changed 30 days ago</p>
                            </div>
                            <button className="text-sm font-medium text-sunset hover:underline">Change</button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
