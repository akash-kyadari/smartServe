
import React from 'react';

export default function Contact() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">Contact Us</h1>
            <div className="bg-card rounded-2xl border border-border overflow-hidden md:flex">
                <div className="md:w-1/2 p-8 bg-muted/30 border-r border-border/50">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Get in Touch</h2>
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" id="name" name="name" className="mt-1 block w-full px-4 py-2 border border-border rounded-md bg-background focus:ring-sunset focus:border-sunset sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" id="email" name="email" className="mt-1 block w-full px-4 py-2 border border-border rounded-md bg-background focus:ring-sunset focus:border-sunset sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                            <textarea id="message" name="message" rows="4" className="mt-1 block w-full px-4 py-2 border border-border rounded-md bg-background focus:ring-sunset focus:border-sunset sm:text-sm"></textarea>
                        </div>
                        <button type="submit" className="w-full bg-sunset hover:bg-sunset/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                            Send Message
                        </button>
                    </form>
                </div>
                <div className="md:w-1/2 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Other Ways to Reach Us</h3>

                    <div className="space-y-4 text-gray-600 dark:text-gray-400">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Email</p>
                            <a href="mailto:support@smartserve.com" className="hover:text-sunset transition-colors">support@smartserve.com</a>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Phone</p>
                            <a href="tel:+1234567890" className="hover:text-sunset transition-colors">+1 (234) 567-890</a>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">Headquarters</p>
                            <p>42 Tech Avenue, Suite 100<br />San Francisco, CA 94107</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
