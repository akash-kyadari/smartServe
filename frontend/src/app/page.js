"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowRight, CheckCircle, Smartphone, ChefHat, LayoutDashboard, QrCode, Menu, X, Moon, Sun, Monitor, Play, Zap, Shield, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

// --- Components ---

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
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
        ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-gray-200 dark:border-slate-800 shadow-sm"
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
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">How it works</a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors">Pricing</a>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-800" />
            <ThemeToggle />

            <div className="flex items-center gap-4 ml-2">
              <Link href="/login" className="text-gray-900 dark:text-white font-semibold text-sm hover:underline">Log in</Link>
              <Link href="#demos" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5">
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
              {['Features', 'How it works', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-slate-900">
                  {item}
                </a>
              ))}
              <div className="border-t border-gray-100 dark:border-slate-800 my-2 pt-2 space-y-2">
                <Link href="/login" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-900">Log in</Link>
                <Link href="#demos" className="block w-full text-center px-4 py-3 rounded-lg text-white bg-sunset font-bold shadow-md shadow-sunset/20">
                  Get Started
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
  <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28 bg-white dark:bg-slate-950 transition-colors duration-300">
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
          v2.0 Now Available
        </span>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-[1.1]">
          The OS for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset to-rose-600 dark:to-orange-400">Modern Dining</span>
        </h1>

        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          Eliminate menu printing, reduce wait times, and streamline kitchen operations with our all-in-one QR ordering platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="#demos" className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-lg hover:opacity-90 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 ring-4 ring-gray-100 dark:ring-slate-800/50">
            Try Interactive Demo <ArrowRight size={20} />
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group">
            <div className="h-8 w-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={14} fill="currentColor" />
            </div>
            Watch Video
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-slate-800/50 flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-gray-400 dark:text-slate-600 grayscale opacity-70">
            {["MCDONALDS", "SUBWAY", "STARBUCKS", "CHIPOTLE", "DOMINOS"].map(brand => (
              <span key={brand} className="font-black text-2xl hover:text-gray-600 dark:hover:text-slate-400 transition-colors cursor-default">{brand}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const BentoGrid = () => (
  <section id="features" className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 px-4">
        <h2 className="text-base text-sunset font-semibold tracking-wide uppercase">Why Smart Serve?</h2>
        <p className="mt-2 text-3xl md:text-4xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white">
          Built for speed, designed for growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
        {/* Large Left Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:col-span-2 md:row-span-2 bg-white dark:bg-slate-950 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group"
        >
          <div className="relative z-10">
            <div className="h-12 w-12 bg-sunset/10 rounded-2xl flex items-center justify-center text-sunset mb-6">
              <Smartphone size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mobile-First Experience</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Zero-friction ordering. No apps to download. Customers scan a QR code and land on a beautiful, responsive menu optimized for conversion.
            </p>
          </div>
          {/* Mockup visual */}
          <div className="absolute right-[-40px] bottom-[-40px] md:right-[-60px] md:bottom-[-60px] w-80 h-[500px] bg-gray-100 dark:bg-slate-900 rounded-[3rem] border-8 border-gray-900 dark:border-slate-800 shadow-2xl transform rotate-[-10deg] group-hover:rotate-[-5deg] group-hover:translate-x-[-10px] transition-all duration-500 overflow-hidden">
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
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-slate-950 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-lg dark:shadow-none relative overflow-hidden group hover:border-sunset/50 transition-colors"
        >
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <Zap size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lightning Fast KDS</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kitchen tickets sync instantly across all devices. 99.9% uptime.</p>
        </motion.div>

        {/* Bottom Right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
            <p className="text-sm text-gray-300">Track revenue, popular items, and staff performance live.</p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const RoleSelector = () => (
  <section id="demos" className="py-24 bg-white dark:bg-slate-950 relative transition-colors duration-300">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 dark:brightness-0 pointer-events-none"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
          Choose your <span className="text-sunset underline decoration-4 underline-offset-4 decoration-sunset/30">Interface</span>
        </h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Smart Serve unifies the entire restaurant workflow. Click a card based on your role to enter the live demo environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Customer", desc: "Scan, Browse & Pay", link: "/customer", icon: QrCode, gradient: "from-orange-400 to-pink-500" },
          { title: "Kitchen", desc: "Ticket Management", link: "/kitchen", icon: ChefHat, gradient: "from-slate-700 to-slate-900" },
          { title: "Waiter", desc: "Service & Billing", link: "/waiter", icon: CheckCircle, gradient: "from-blue-500 to-cyan-400" },
          { title: "Owner", desc: "Analytics & Admin", link: "/admin", icon: LayoutDashboard, gradient: "from-emerald-500 to-teal-400" },
        ].map((role, i) => (
          <Link key={role.title} href={role.link} className="group relative overflow-hidden rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-80">
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

            {/* Glass Overlay effect */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

            <div className="relative p-8 h-full flex flex-col justify-between text-white">
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <role.icon size={28} />
              </div>

              <div>
                <h3 className="text-3xl font-bold mb-2 tracking-tight">{role.title}</h3>
                <p className="text-white/80 text-sm font-medium leading-relaxed border-l-2 border-white/30 pl-3">{role.desc}</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                <span className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg">Launch Demo</span>
                <div className="h-8 w-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center"><ArrowRight size={14} /></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pt-20 pb-10 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 bg-sunset rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">Smart Serve</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Reinventing the dining experience with modern technology and seamless design.
          </p>
          <div className="flex gap-4">
            {/* Social Placeholders */}
            {[1, 2, 3].map(i => <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-slate-800 rounded-full hover:bg-sunset transition-colors cursor-pointer" />)}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
            <li><a href="#" className="hover:text-sunset transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Case Studies</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
            <li><a href="#" className="hover:text-sunset transition-colors">About</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white mb-6">Legal</h4>
          <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
            <li><a href="#" className="hover:text-sunset transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-sunset transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-slate-800 pt-8 text-center text-sm text-gray-400">
        <p>&copy; 2026 Smart Serve Inc. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <Hero />
      <BentoGrid />
      <RoleSelector />
      <Footer />
    </div>
  );
}
