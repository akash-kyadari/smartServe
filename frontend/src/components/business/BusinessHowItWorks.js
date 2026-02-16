
import React from 'react';
import { ClipboardList, QrCode, MonitorPlay, TrendingUp } from 'lucide-react';

const BusinessHowItWorks = () => {
    return (
        <section id="how-it-works" className="py-20 bg-background transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-base text-sunset font-semibold tracking-wide uppercase">Streamline Operations</h2>
                <p className="mt-2 text-3xl md:text-4xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white mb-16">
                    How it works for Restaurants
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        {
                            title: "1. Create Profile",
                            desc: "Sign up and set up your restaurant profile, tables, and digital menu in minutes.",
                            icon: <ClipboardList size={32} />
                        },
                        {
                            title: "2. Get QR Codes",
                            desc: "Download unique QR codes for each table. Guests scan to view the menu.",
                            icon: <QrCode size={32} />
                        },
                        {
                            title: "3. Manage Orders",
                            desc: "Orders land instantly on your Kitchen Display System (KDS) and Waiter POS.",
                            icon: <MonitorPlay size={32} />
                        },
                        {
                            title: "4. Track Growth",
                            desc: "Monitor real-time sales, popular dishes, and staff performance analytics.",
                            icon: <TrendingUp size={32} />
                        }
                    ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-16 w-16 bg-secondary rounded-2xl flex items-center justify-center text-sunset mb-6 shadow-lg shadow-sunset/10">
                                {step.icon}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BusinessHowItWorks;
