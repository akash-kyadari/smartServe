"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function RestroSignup() {
    const [form, setForm] = useState({
        restroname: "",
        ownerName: "",
        email: "",
        contactNumber: "",
        address: "",
        type: "veg",
        noOfTables: "",
        ac: "ac",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: call backend API to register restaurant owner
        console.log("restro-signup form submit", form);
        alert("Registration submitted (UI only demo)");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-3xl w-full bg-white dark:bg-slate-950 rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurant Owner Registration</h1>
                    <p className="text-sm text-gray-500">Create an account for your restaurant to access business tools.</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Restaurant name</label>
                        <input name="restroname" value={form.restroname} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner name</label>
                        <input name="ownerName" value={form.ownerName} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact number</label>
                        <input name="contactNumber" type="tel" value={form.contactNumber} onChange={handleChange} required className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <textarea name="address" value={form.address} onChange={handleChange} rows={3} required className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                        <select name="type" value={form.type} onChange={handleChange} className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm">
                            <option value="veg">Veg</option>
                            <option value="nonveg">Non-veg</option>
                            <option value="both">Both</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">No. of tables</label>
                        <input name="noOfTables" type="number" min="1" value={form.noOfTables} onChange={handleChange} className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AC / Non-AC</label>
                        <select name="ac" value={form.ac} onChange={handleChange} className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-sm">
                            <option value="ac">AC</option>
                            <option value="nonac">Non-AC</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">Already have an account? <Link href="/restro-login" className="text-sunset underline">Sign in</Link></div>
                        <button type="submit" className="ml-4 bg-emerald-600 text-white px-5 py-2 rounded-xl font-semibold">Create account</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
