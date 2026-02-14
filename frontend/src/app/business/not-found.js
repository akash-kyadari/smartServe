"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, ArrowLeft, Search, AlertCircle } from "lucide-react";

export default function BusinessNotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-sunset/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="h-20 w-20 bg-sunset/10 rounded-2xl flex items-center justify-center text-sunset mb-8">
                            <AlertCircle size={40} />
                        </div>

                        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">404</h1>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                            Resources Not Found
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto">
                            We couldn't find the business tool or page you're looking for. It might have moved or you might have entered the wrong URL.
                        </p>

                        <div className="w-full h-px bg-border mb-8"></div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-muted text-gray-900 dark:text-white font-bold hover:bg-muted/80 transition-all active:scale-95"
                            >
                                <ArrowLeft size={18} />
                                Previous Page
                            </button>
                            <Link
                                href="/business"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-xl hover:opacity-90 transition-all active:scale-95"
                            >
                                <LayoutDashboard size={18} />
                                Business Portal
                            </Link>
                        </div>

                        <div className="mt-8">
                            <Link href="/" className="text-sm font-medium text-sunset hover:underline inline-flex items-center gap-1">
                                Go to Guest Site <Search size={14} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
