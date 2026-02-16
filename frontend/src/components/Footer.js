
import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-muted border-t border-border pt-16 pb-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white">Smart Serve</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Fast, friendly ordering from your phone — enjoy more time eating and less time waiting.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">For Diners</h4>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link href="/#how-it-works" className="hover:text-sunset transition-colors">How it works</Link></li>
                            <li><Link href="/restaurants" className="hover:text-sunset transition-colors">Explore restaurants</Link></li>
                            <li><Link href="/privacy" className="hover:text-sunset transition-colors">Safety & privacy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Support</h4>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link href="/help" className="hover:text-sunset transition-colors">Help Center</Link></li>
                            <li><Link href="/contact" className="hover:text-sunset transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li><Link href="/privacy" className="hover:text-sunset transition-colors">Privacy</Link></li>
                            <li><Link href="/terms" className="hover:text-sunset transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-800 pt-6 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Smart Serve. Made for great meals.</p>
                </div>
            </div>
        </footer>
    );
}
