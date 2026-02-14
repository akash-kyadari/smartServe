"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Ghost } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative mb-8 flex justify-center">
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="text-sunset opacity-20 absolute top-0"
                        >
                            <Ghost size={160} />
                        </motion.div>
                        <h1 className="text-9xl font-black text-gray-900 dark:text-white relative z-10">404</h1>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 italic">
                        Oops! This table is missing.
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                        It seems the page you're looking for has been cleared from the menu.
                        Let's get you back to the main dining room.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-muted text-gray-900 dark:text-white font-semibold hover:bg-muted/80 transition-all active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sunset text-white font-semibold shadow-lg shadow-sunset/20 hover:opacity-90 transition-all active:scale-95"
                        >
                            <Home size={18} />
                            Return Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
