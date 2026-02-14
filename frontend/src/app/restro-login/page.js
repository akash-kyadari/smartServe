"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail, Lock, Briefcase, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";

export default function RestroLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("owner");
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const router = useRouter();
    const { login, isLoading, error, isAuthenticated, isLoading: authLoading, user } = useAuthStore();

    // Redirect if already authenticated as restaurant staff
    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role !== 'customer') {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        try {
            await login(email, password, role);

            // Redirect based on role
            if (role === 'owner') router.push('/business');
            else if (role === 'manager') router.push('/business/manager'); // Managers also go to business dashboard
            else if (role === 'kitchen') router.push('/business/kitchen');
            else if (role === 'waiter') router.push('/business/waiter');
            else router.push('/');

        } catch (err) {
            // Error is handled by store
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10 text-center lg:text-left">
                        <Link href="/business" className="inline-flex items-center gap-2 mb-8 group">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-lg">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve</span>
                        </Link>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Restaurant Staff Sign in</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in as Owner, Kitchen, or Waiter to access your interface.</p>
                    </div>

                    <div className="mt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        ref={emailRef}
                                        required
                                        type="email"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="you@restaurant.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        ref={passwordRef}
                                        required
                                        type={showPassword ? "text" : "password"}
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sunset focus:border-sunset sm:text-sm transition-all dark:text-white"
                                        placeholder="••••••"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Briefcase size={18} />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-3 appearance-none bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sunset sm:text-sm text-gray-900 dark:text-white transition-all cursor-pointer"
                                    >
                                        <option value="owner">Owner</option>
                                        <option value="manager">Manager</option>
                                        <option value="kitchen">Kitchen</option>
                                        <option value="waiter">Waiter</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
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
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Signing in...</span>
                                    ) : (
                                        <span className="flex items-center gap-2">Sign in <ArrowRight size={16} /></span>
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

                            <button
                                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google?from=staff`}
                                className="mt-4 w-full inline-flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                        </div>

                        <div className="mt-6 text-sm text-center">
                            <p className="text-gray-500">Don't have a restaurant account? <Link href="/restro-signup" className="text-sunset underline">Register</Link></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block relative flex-1 overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0 opacity-90" />
                <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-20 xl:px-24 text-white">
                    <h3 className="text-4xl font-bold mb-4">Welcome back</h3>
                    <p className="text-gray-300 max-w-lg">Choose the proper role to access that interface.</p>
                </div>
            </div>
        </div>
    );
}
