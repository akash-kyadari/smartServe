"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import useAuthStore from "@/store/useAuthStore";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");

    // Use refs for better performance
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const { signup, isLoading, error: storeError, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const router = useRouter();

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, router]);

    const validateInputs = () => {
        const name = nameRef.current.value;
        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        if (!name || name.length < 2) {
            setFormError("Please enter your full name.");
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
            await signup(nameRef.current.value, emailRef.current.value, passwordRef.current.value);
            router.push("/");
        } catch (err) {
            // Error is handled by store and displayed via error state
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10 text-center lg:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve</span>
                        </Link>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Create your account
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Already have an account? <Link href="/login" className="font-medium text-sunset hover:text-orange-600">Sign in</Link>
                        </p>
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
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        ref={nameRef}
                                        className="block w-full py-3 px-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="Your name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        ref={emailRef}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        ref={passwordRef}
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="••••••••"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Creating account...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">Create account <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-slate-950 text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-3">
                                <button className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" aria-label="Continue with Google">
                                    <span>Continue with Google</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block relative flex-1 overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0 opacity-90" />

                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-sunset rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />

                <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-20 xl:px-24 text-white">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="h-16 w-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                            <User size={32} className="text-sunset" />
                        </div>
                        <h2 className="text-4xl font-bold mb-6 leading-tight">Welcome to Smart Serve</h2>
                        <p className="text-gray-300 max-w-lg">Create your account to get started. Join thousands of restaurants managing their business efficiently.</p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
