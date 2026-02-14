"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Search, Filter, Calendar, ChevronLeft, ChevronRight, Download, Eye, X } from "lucide-react";
import useRestaurantStore from "@/store/useRestaurantStore";
import RoleGuard from "@/components/auth/RoleGuard";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useDebounce from "@/hooks/useDebounce";

function OrderHistoryContent() {
    const { id: restaurantId } = useParams();

    // State
    const { dashboardData, setDashboardData } = useRestaurantStore();

    // Initialize from store if available
    const storedHistory = dashboardData[restaurantId]?.history || {};

    // State
    const [orders, setOrders] = useState(storedHistory.orders || []);
    const [page, setPage] = useState(storedHistory.filters?.page || 1);
    const [totalPages, setTotalPages] = useState(storedHistory.pagination?.pages || 1);
    const [totalOrders, setTotalOrders] = useState(storedHistory.pagination?.total || 0);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filters
    // Filters - Init from store
    const [statusFilter, setStatusFilter] = useState(storedHistory.filters?.statusFilter || '');
    const [fromDate, setFromDate] = useState(storedHistory.filters?.fromDate || '');
    const [toDate, setToDate] = useState(storedHistory.filters?.toDate || '');
    const [searchTerm, setSearchTerm] = useState(storedHistory.filters?.searchTerm || '');

    // Loading is true only if we have NO orders to show
    const [loading, setLoading] = useState(!storedHistory.orders);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const LIMIT = 10;

    const fetchOrders = async (signal) => {
        // deduplication check
        const currentFilters = {
            page,
            statusFilter,
            fromDate,
            toDate,
            searchTerm: debouncedSearchTerm
        };

        const stored = dashboardData[restaurantId]?.history;

        // If we have stored data, and the filters match exactly what we are asking for,
        // and we already have orders in state (which we initialized), SKIP fetch.
        if (stored &&
            JSON.stringify(stored.filters) === JSON.stringify(currentFilters) &&
            stored.orders && stored.orders.length > 0) {

            // Just ensure loading is false
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const query = new URLSearchParams({
                page,
                limit: LIMIT,
                restaurantId
            });

            if (statusFilter) query.append('status', statusFilter);
            if (fromDate) query.append('fromDate', fromDate);
            if (toDate) query.append('toDate', toDate);
            if (debouncedSearchTerm) query.append('search', debouncedSearchTerm);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/history/${restaurantId}?${query.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                signal // Pass signal to fetch
            });

            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setTotalPages(data.pagination.pages);
                setTotalOrders(data.pagination.total);

                // Cache the result
                setDashboardData(restaurantId, {
                    history: {
                        orders: data.orders,
                        pagination: { pages: data.pagination.pages, total: data.pagination.total },
                        filters: currentFilters
                    }
                });
            } else {
                toast.error(data.message || "Failed to fetch order history");
            }

        } catch (error) {
            if (error.name === 'AbortError') return; // Ignore aborts
            console.error("Error fetching orders:", error);
            toast.error("Error loading order history");
        } finally {
            // Only turn off loading if not aborted (or maybe always? if aborted, we might stay loading? no)
            // If aborted, new request replaces it, so that new request manages loading.
            // If we turn off loading here on abort, the UI might flicker.
            // But if we don't, and it was the *only* request, we are stuck.
            // But abort only happens on unmount or re-run. Re-run starts new fetch which sets loading=true.
            // So it's safe to set false? Or better to check signal.aborted?
            // Actually, if aborted, we shouldn't touch state usually.
            if (signal && !signal.aborted) setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        if (restaurantId) {
            const controller = new AbortController();
            fetchOrders(controller.signal);
            return () => controller.abort();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId, statusFilter, fromDate, toDate, debouncedSearchTerm, page]);

    // Search handler
    const handleSearch = (e) => {
        e.preventDefault();
        // Effect handles fetch
    };

    // Calculate total revenue for this page (just a sample metric)
    const pageRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="text-sunset" />
                    Order History & Analytics
                </h1>
                <p className="text-gray-500 text-sm mt-1">Review past orders, sales, and performance.</p>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm mb-6">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">

                    {/* Search */}
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">Search Order ID / Table</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-sunset outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-sunset outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="PLACED">Placed</option>
                            <option value="PREPARING">Preparing</option>
                            <option value="READY">Ready</option>
                            <option value="SERVED">Served</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="PAID">Paid</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    {/* Date Range - From */}
                    <div className="w-full md:w-40">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-sunset outline-none text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Date Range - To */}
                    <div className="w-full md:w-40">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-sunset outline-none text-gray-900 dark:text-white"
                        />
                    </div>

                    <button type="submit" className="px-4 py-2 bg-sunset text-white rounded-lg hover:bg-sunset/90 transition-colors h-[42px]">
                        Apply
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('');
                            setFromDate('');
                            setToDate('');
                            setPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors h-[42px]"
                    >
                        Reset
                    </button>
                </form>
            </div>

            {/* Quick Stats for filtered view */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase">Revenue (This Page)</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${pageRevenue.toFixed(2)}</p>
                </div>
            </div> */}

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Orders List <span className="text-xs font-normal text-gray-500 ml-2">Total: {totalOrders}</span>
                    </h3>
                    {loading && <Loader2 className="animate-spin text-gray-400" size={18} />}
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-800 text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-slate-800/50">
                                <th className="p-4 font-medium">Order ID</th>
                                <th className="p-4 font-medium">Date & Time</th>
                                <th className="p-4 font-medium">Table</th>
                                <th className="p-4 font-medium">Items</th>
                                <th className="p-4 font-medium">Total</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Waiter</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-gray-400">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-gray-500">
                                        No orders found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4 font-mono text-xs text-gray-500">#{order._id.slice(-6).toUpperCase()}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{format(new Date(order.createdAt), "MMM d, yyyy")}</div>
                                            <div className="text-xs text-gray-500">{format(new Date(order.createdAt), "h:mm a")}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-xs font-semibold">
                                                T-{order.tableNo || '?'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300 max-w-[200px] truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                            {order.items.length} items
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                                            ₹{order.totalAmount?.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                order.status === 'PAID' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {order.waiterId?.name || <span className="text-gray-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 hover:bg-sunset/10 text-gray-500 hover:text-sunset rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start bg-gray-50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Details</h3>
                                    <p className="text-sm text-gray-500">#{selectedOrder._id.toUpperCase()}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Status</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase">Table</p>
                                            <p className="font-bold text-gray-900 dark:text-white">#{selectedOrder.tableNo}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase">Date</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{format(new Date(selectedOrder.createdAt), "MMM d")}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Items</h4>
                                        <div className="space-y-2">
                                            {selectedOrder.items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-start py-2 border-b border-dashed border-gray-100 dark:border-slate-800 last:border-0">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sunset">{item.quantity}x</span>
                                                            <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                                                        </div>
                                                        {item.price && <div className="text-xs text-gray-500">@ ₹{item.price}</div>}
                                                    </div>
                                                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-gray-100 dark:border-slate-800 pt-4 flex justify-between items-center">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">Total Amount</span>
                                        <span className="font-bold text-xl text-sunset">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                                    </div>

                                    {selectedOrder.waiterId && (
                                        <div className="text-xs text-gray-400 text-center pt-2">
                                            Served by {selectedOrder.waiterId.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function OrderHistoryPage() {
    return (
        <RoleGuard allowedRoles={['owner', 'manager']}>
            <OrderHistoryContent />
        </RoleGuard>
    );
}
