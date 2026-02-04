"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, ChefHat, CheckCircle, QrCode, ArrowRight, TrendingUp, Zap, Shield, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function BusinessHome() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return (
        <div className="min-h-screen font-sans bg-background transition-colors duration-300">
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve — Business</span>
                        </div>

                        <div className="flex items-center gap-4">
                        
                            <Link href="/restro-login" className="text-gray-900 dark:text-white font-semibold text-sm hover:underline">Login</Link>
                            <Link href="/restro-signup" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90">Register</Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Tools for restaurants, built for operations</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Access dashboards, manage menus, monitor kitchen tickets, and review analytics — everything you need to run a smoother service.
                    </p>
                </div>

                {/* Benefits */}
                <div className="mt-8 mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-lg text-center">
                        <div className="mx-auto h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                            <TrendingUp size={20} />
                        </div>
                        <h4 className="font-bold text-lg mb-2">Increase Revenue</h4>
                        <p className="text-sm text-gray-500">Higher table turns and upsells driven by fast mobile ordering and intelligent recommendations.</p>
                    </div>

                    <div className="bg-card rounded-2xl p-6 border border-border shadow-lg text-center">
                        <div className="mx-auto h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                            <Zap size={20} />
                        </div>
                        <h4 className="font-bold text-lg mb-2">Speed Up Service</h4>
                        <p className="text-sm text-gray-500">Real-time KDS, order batching, and clear prep timers reduce mistakes and wait time.</p>
                    </div>

                    <div className="bg-card rounded-2xl p-6 border border-border shadow-lg text-center">
                        <div className="mx-auto h-12 w-12 bg-sunset/10 rounded-full flex items-center justify-center text-sunset mb-4">
                            <Shield size={20} />
                        </div>
                        <h4 className="font-bold text-lg mb-2">Safe & Secure</h4>
                        <p className="text-sm text-gray-500">PCI-ready payments and role-based access keep guest data and operations secure.</p>
                    </div>
                </div>

                
                {/* Role selector moved here from homepage */}
                <section id="demos" className="py-12 bg-background relative transition-colors duration-300 mt-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Choose the interface to demo</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Select a card to launch the live demo for that role.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Customer", desc: "Scan, Browse & Pay", link: "/customer-demo", icon: QrCode, gradient: "from-orange-400 to-pink-500", features: ["QR ordering", "Secure payments", "Saved receipts"] },
                                { title: "Kitchen", desc: "Ticket Management", link: "/kitchen-demo", icon: ChefHat, gradient: "from-slate-700 to-slate-900", features: ["Realtime tickets", "Prep timers", "Order batching"] },
                                { title: "Waiter", desc: "Service & Billing", link: "/waiter-demo", icon: CheckCircle, gradient: "from-blue-500 to-cyan-400", features: ["Table management", "Split bills", "Integrated POS"] },
                                { title: "Manager", desc: "Analytics & Admin", link: "/admin-demo", icon: LayoutDashboard, gradient: "from-emerald-500 to-teal-400", features: ["Revenue reports", "Item performance", "Staff analytics"] },
                            ].map((role) => (
                                <Link key={role.title} href={role.link} className="group relative overflow-hidden rounded-3xl shadow-2xl transition-transform duration-300 hover:scale-105 h-72 flex flex-col">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                                    <div className="relative z-10 p-6 flex-1 flex flex-col justify-between text-white">
                                        <div>
                                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 mb-4">
                                                <role.icon size={22} />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">{role.title}</h3>
                                            <p className="text-white/90 text-sm mb-4">{role.desc}</p>
                                            <ul className="text-white/90 text-xs space-y-2 mb-4">
                                                {role.features.map((f) => (
                                                    <li key={f} className="flex items-start gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-white/80 mt-2" />
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wider">Live demo</span>
                                            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                                                <span className="text-white text-sm font-medium">Launch</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="restaurant-features" className="py-12 bg-muted transition-colors duration-300 mt-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Tools restaurants actually use</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Manage orders, staff, and menus — and get insights that help you serve more customers.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[520px]">
                            <motion.div
                                initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="md:col-span-2 md:row-span-2 bg-card rounded-3xl p-8 border border-border shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group"
                            >
                                <div className="relative z-10">
                                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                                        <LayoutDashboard size={28} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Unified Operations</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">One place to manage menus, orders, staff, and settings — reduce friction and keep service consistent across shifts.</p>
                                </div>

                                <div className="hidden md:block absolute right-[-40px] bottom-[-40px] md:right-[-60px] md:bottom-[-60px] w-80 h-[420px] bg-gray-100 dark:bg-slate-900 rounded-[2.5rem] border-8 border-gray-900 dark:border-slate-800 shadow-2xl transform rotate-[-8deg] group-hover:rotate-[-4deg] transition-all duration-500 overflow-hidden">
                                    <div className="w-full h-full bg-white dark:bg-slate-950 p-4">
                                        <div className="w-full h-28 bg-gray-100 dark:bg-slate-900 rounded-xl mb-4 animate-pulse" />
                                        <div className="space-y-3">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className="flex gap-3 items-center">
                                                    <div className="w-14 h-14 bg-gray-100 dark:bg-slate-900 rounded-lg" />
                                                    <div className="flex-1">
                                                        <div className="h-3 bg-gray-100 dark:bg-slate-900 rounded w-3/4 mb-2" />
                                                        <div className="h-2 bg-gray-50 dark:bg-slate-900/50 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-card rounded-3xl p-8 border border-border shadow-lg dark:shadow-none relative overflow-hidden group hover:border-emerald-500/50 transition-colors"
                            >
                                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                    <Zap size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kitchen & KDS</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Routes orders instantly, batch items, and reduce prep errors with live kitchen displays.</p>
                            </motion.div>

                            <motion.div
                                initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="bg-gray-900 dark:bg-slate-800 rounded-3xl p-8 shadow-lg dark:shadow-none text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-sunset/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="relative z-10">
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 backdrop-blur-md">
                                        <TrendingUp size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Analytics & Insights</h3>
                                    <p className="text-sm text-gray-300">Understand peak times, popular items, and staff performance to optimize operations and increase revenue.</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>If you're a guest, go back to the main site — <Link href="/" className="text-sunset underline">Visit homepage</Link>.</p>
                </div>
            </main>
        </div>
    );
}
