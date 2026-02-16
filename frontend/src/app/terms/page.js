
import React from 'react';

export default function Terms() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="prose dark:prose-invert">
                <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing or using our services, you agree to be bound by these Terms of Service.
                </p>

                <h2 className="text-xl font-semibold mb-3">2. User Accounts</h2>
                <p className="mb-4">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>

                <h2 className="text-xl font-semibold mb-3">3. Use of Services</h2>
                <p className="mb-4">
                    You agree to use our services only for lawful purposes and in accordance with these Terms.
                </p>
            </div>
        </div>
    );
}
