
import React from 'react';

export default function Privacy() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose dark:prose-invert">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <p className="mb-4">
                    We collect information you provide directly to us, such as when you create an account, make a reservation, or communicate with us.
                </p>

                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="mb-4">
                    We use the information we collect to operate, maintain, and improve our services, such as processing transactions and personalizing your experience.
                </p>

                <h2 className="text-xl font-semibold mb-3">3. Data Security</h2>
                <p className="mb-4">
                    We implement reasonable security measures to protect your personal information.
                </p>
            </div>
        </div>
    );
}
