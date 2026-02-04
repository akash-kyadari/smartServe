"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Smartphone, Menu, X, Moon, Sun, Zap, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

// --- Components ---

const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
      aria-label="Toggle Theme"
    >
      {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={clsx(
      "sticky top-0 z-50 transition-all duration-300 border-b",
      scrolled
        ? "bg-background/80 backdrop-blur-md border-border shadow-sm"
        : "bg-transparent border-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sunset/20">S</div>
            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Smart Serve</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Explore</a>
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">How it works</a>
            <a href="/business" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">For Restaurants</a>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />
            <ThemeToggle />

            <div className="flex items-center gap-4 ml-2">
              <Link href="/login" className="text-gray-900 dark:text-white font-semibold text-sm hover:underline">Log in</Link>
              <Link href="/signup" className="bg-sunset text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5">
               Get Started
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {['Explore', 'How it works'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-900">
                  {item}
                </a>
              ))}
                <Link href="/business" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-900">For Restaurants</Link>
              <div className="border-t border-gray-100 dark:border-slate-800 my-2 pt-2 space-y-2">
                <Link href="/login" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-900">Log in</Link>
                <Link href="/signup" className="block w-full text-center px-4 py-3 rounded-lg text-white bg-sunset font-bold shadow-md shadow-sunset/20">
                  get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => (
  <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28 bg-background transition-colors duration-300">
    {/* Background Blobs */}
    <div className="absolute -top-24 -left-20 w-96 h-96 bg-orange-100 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[128px] opacity-70 animate-blob"></div>
    <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-100 dark:bg-rose-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[128px] opacity-70 animate-blob animation-delay-2000"></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-orange-50 dark:bg-orange-950/30 text-sunset border border-orange-100 dark:border-orange-900/50 text-xs font-bold uppercase tracking-wider mb-6 hover:scale-105 transition-transform cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sunset opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sunset"></span>
          </span>
          Try contactless ordering — No app needed
        </span>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 leading-[1.1]">
          Order, pay, and enjoy —
          <br className="hidden md:block" /> the easiest way to dine in.
        </h1>

        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Scan a QR, browse a restaurant's menu, place your order, and pay — all from your phone. Faster service, safer contactless payments, and fewer wait times.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/login" className="px-8 py-3 bg-sunset text-white rounded-full font-bold text-lg shadow-2xl hover:opacity-95 transition-transform hover:-translate-y-1">
            Order Now
          </Link>
          <Link href="/customer-demo" className="px-8 py-3 bg-black text-white rounded-full font-bold text-lg shadow-2xl hover:opacity-95 transition-transform hover:-translate-y-1">
            Try the Demo
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800/50 flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Loved by diners</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-gray-400 dark:text-slate-600 opacity-75">
            {["Quick Bites", "Neighborhood Deli", "Cozy Café", "Urban Grill"].map(brand => (
              <span key={brand} className="font-bold text-lg hover:text-gray-600 dark:hover:text-slate-400 transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const BentoGrid = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section id="features" className="py-20 bg-muted transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 px-4">
          <h2 className="text-base text-sunset font-semibold tracking-wide uppercase">Why diners love it</h2>
          <p className="mt-2 text-3xl md:text-4xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white">
            Faster orders. Safer payments. Happier meals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[560px]">
          {/* Large Left Card */}
          <motion.div
            initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 md:row-span-2 bg-card rounded-3xl p-8 border border-border shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group"
          >
            <div className="relative z-10">
              <div className="h-12 w-12 bg-sunset/10 rounded-2xl flex items-center justify-center text-sunset mb-6">
                <Smartphone size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order from your table</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Scan a QR, browse the menu, and place your order in seconds — no app, no wait. Save favorites, split the bill, and pay securely from your phone.
              </p>
            </div>
            {/* Mockup visual */}
            <div className="hidden md:block absolute right-[-40px] bottom-[-40px] md:right-[-60px] md:bottom-[-60px] w-80 h-[500px] bg-gray-100 dark:bg-slate-900 rounded-[3rem] border-8 border-gray-900 dark:border-slate-800 shadow-2xl transform rotate-[-10deg] group-hover:rotate-[-5deg] group-hover:translate-x-[-10px] transition-all duration-500 overflow-hidden">
              <div className="w-full h-full bg-white dark:bg-slate-950 p-4">
                <div className="w-full h-32 bg-gray-100 dark:bg-slate-900 rounded-xl mb-4 animate-pulse" />
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="flex gap-4"><div className="w-16 h-16 bg-gray-100 dark:bg-slate-900 rounded-lg shrink-0" /><div className="flex-1 space-y-2 py-1"><div className="h-4 bg-gray-100 dark:bg-slate-900 rounded w-3/4" /><div className="h-3 bg-gray-50 dark:bg-slate-900/50 rounded w-1/2" /></div></div>)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Right */}
          <motion.div
            initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 border border-border shadow-lg dark:shadow-none relative overflow-hidden group hover:border-sunset/50 transition-colors"
          >
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <Zap size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fast checkout</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quick, secure payments with saved cards and contactless options to get you back to your meal faster.</p>
          </motion.div>

          {/* Bottom Right */}
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
              <h3 className="text-xl font-bold mb-2">Track your order</h3>
              <p className="text-sm text-gray-300">See order status and estimated time to be served — so you know exactly when your food arrives.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// RoleSelector moved to the business page. Keeping selection logic centralized on /business.

const Footer = () => (
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
            <li><a href="#" className="hover:text-sunset transition-colors">How it works</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Explore menus</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Safety & privacy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Support</h4>
          <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
            <li><a href="#" className="hover:text-sunset transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
            <li><a href="#" className="hover:text-sunset transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-slate-800 pt-6 text-center text-sm text-gray-400">
        <p>&copy; 2026 Smart Serve. Made for great meals.</p>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-background transition-colors duration-300">
      <Navbar />
      <Hero />
      <BentoGrid />
      <Footer />
    </div>
  );
}
