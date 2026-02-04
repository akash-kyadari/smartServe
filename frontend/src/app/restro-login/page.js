"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";

export default function RestroLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("owner");

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: authenticate with backend
        alert(`Sign in as ${role} (UI demo)`);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10 text-center lg:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve</span>
                        </Link>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Restaurant Staff Sign in</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in as Owner, Kitchen, or Waiter to access your interface.</p>
                    </div>

                    <div className="mt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input required type="email" className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white" placeholder="you@restaurant.com" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input required type={showPassword ? "text" : "password"} className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white" placeholder="••••••" />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm">
                                    <option value="owner">Owner</option>
                                    <option value="kitchen">Kitchen</option>
                                    <option value="waiter">Waiter</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input id="remember-me-restro" name="remember-me-restro" type="checkbox" className="h-4 w-4 text-sunset focus:ring-sunset border-gray-300 rounded" />
                                    <label htmlFor="remember-me-restro" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-medium text-sunset">Forgot password?</a>
                                </div>
                            </div>

                            <div>
                                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all">
                                    <span className="flex items-center gap-2">Sign in <ArrowRight size={16} /></span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-6 text-sm text-center">
                        <p className="text-gray-500">Don't have a restaurant account? <Link href="/restro-signup" className="text-sunset underline">Register</Link></p>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block relative flex-1 overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0 opacity-90" />
                <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-20 xl:px-24 text-white">
                    <h3 className="text-4xl font-bold mb-4">Welcome back</h3>
                    <p className="text-gray-300 max-w-lg">Choose the proper role to access that interface. This is a UI-only demo.</p>
                </div>
            </div>
        </div>
    );
}
