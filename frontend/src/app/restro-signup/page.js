"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Mail, User, Lock, Eye, EyeOff, Loader2, AlertCircle, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

export default function RestroSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");

    // Use refs for inputs
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const router = useRouter();
    const { signup, isLoading, error: storeError } = useAuthStore();

    const validateInputs = () => {
        const name = nameRef.current.value;
        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        if (!name || name.length < 2) {
            setFormError("Name must be at least 2 characters.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setFormError("Please enter a valid email address.");
            return false;
        }

        if (!password || password.length < 6) {
            setFormError("Password must be at least 6 characters long.");
            return false;
        }

        setFormError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateInputs()) return;

        try {
            const name = nameRef.current.value;
            const email = emailRef.current.value;
            const password = passwordRef.current.value;

            // Register as 'owner' role
            await signup(name, email, password, 'owner');

            // Redirect after successful signup
            // In a real app, you might redirect to a restaurant setup wizard
            router.push("/business");
        } catch (error) {
            // Error handling is managed by the store, but we can log if needed
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-slate-950 transition-colors duration-300 py-12">
                <div className="mx-auto w-full max-w-sm lg:w-[28rem]">
                    <div className="mb-10 text-center lg:text-left">
                        <Link href="/business" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve</span>
                        </Link>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Partner Signup
                        </h2>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p>Create your restaurant owner account.</p>
                            <p>
                                <Link href="/restro-login" className="font-medium text-sunset hover:text-orange-600 transition-colors">
                                    Already have a business account? Login here.
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {(storeError || formError) && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{formError || storeError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        ref={emailRef}
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="owner@restaurant.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        ref={passwordRef}
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="••••••••"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Creating Account...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">Create Business Account <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:block relative flex-1 overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0 opacity-90" />

                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />

                <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-20 xl:px-24 text-white">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="h-16 w-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-xl">
                            <Store size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-4xl font-bold mb-6 leading-tight">Grow your business with Smart Serve</h3>
                        <p className="text-gray-300 max-w-lg text-lg mb-8">
                            Join our network of premium restaurants. Seamless management, analytics, and better customer experiences await.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Real-time order management",
                                "Digital menu with dynamic pricing",
                                "Kitchen & Waiter coordination apps",
                                "Detailed sales analytics"
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                    </div>
                                    <span className="text-gray-300">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
