
import React from 'react';

export default function Help() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
            <h1 className="text-4xl font-bold mb-6">Help Center</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Need assistance? Check our FAQs or contact our support team.
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-xl font-bold mb-3">Frequently Asked Questions</h3>
                    <ul className="space-y-4">
                        <li>
                            <h4 className="font-semibold">How do I reset my password?</h4>
                            <p className="text-sm text-muted-foreground">Go to the login page and click "Forgot Password". Emailed instructions will follow.</p>
                        </li>
                        <li>
                            <h4 className="font-semibold">How do I change my subscription?</h4>
                            <p className="text-sm text-muted-foreground">Visit your account settings to manage your plan.</p>
                        </li>
                    </ul>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="text-xl font-bold mb-3">Contact Support</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Still have questions? Our support team is here to help.
                    </p>
                    <a href="/contact" className="inline-block bg-sunset text-white px-6 py-2 rounded-lg font-medium hover:bg-sunset/90 transition-colors">
                        Contact Us
                    </a>
                </div>
            </div>
        </div>
    );
}
