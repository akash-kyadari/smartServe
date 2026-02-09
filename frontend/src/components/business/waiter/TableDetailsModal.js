
import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle, Bell, X, LogOut, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function TableDetailsModal({
    table,
    orders,
    restaurantId,
    onClose,
    onUpdate
}) {
    if (!table) return null;

    // Filter Active Orders for this table (excluding closed sessions)
    const activeTableOrders = orders.filter(o => o.tableId === table.id && o.status !== 'COMPLETED' && !o.isSessionClosed);
    const totalAmount = activeTableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const hasUnpaid = activeTableOrders.some(o => o.status !== 'PAID');
    // "All Paid" is true if there are orders and ALL are paid
    const allPaid = activeTableOrders.length > 0 && activeTableOrders.every(o => o.status === 'PAID');

    // Unserved check
    const unservedCount = activeTableOrders.filter(o => ['PLACED', 'PREPARING', 'READY'].includes(o.status)).length;

    const handleMarkServed = async (orderId) => {
        try {
            await axios.put(`${API_URL}/orders/${orderId}/status`, { status: "SERVED" }, { withCredentials: true });
            if (onUpdate) onUpdate(); // Trigger refresh
        } catch (err) {
            console.error("Failed to mark served", err);
            alert("Failed to update status");
        }
    };

    const handleMarkTablePaid = async () => {
        if (unservedCount > 0) {
            alert(`Cannot mark as paid. Please serve ${unservedCount} pending active order${unservedCount !== 1 ? 's' : ''} first.`);
            return;
        }

        if (!confirm("Mark all active orders for this table as PAID?")) return;
        try {
            await axios.put(`${API_URL}/orders/table/${table.id}/pay`, { restaurantId }, { withCredentials: true });
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            // Handle specific 400 error for unserved orders
            const msg = err.response?.data?.message || "Failed to mark table as paid";
            alert(msg);
        }
    };

    const handleFreeTable = async () => {
        if (!confirm("Are you sure you want to close this session? This will free the table.")) return;

        try {
            await axios.post(`${API_URL}/orders/free-table`, {
                restaurantId,
                tableId: table.id
            }, { withCredentials: true });
            onClose();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            const data = err.response?.data;
            const msg = data?.message || "Failed to close session";
            const orderStatus = data?.orderStatus;
            const activeOrderId = data?.activeOrderId;

            // Handle "Stuck" Orders (Legacy or edge case)
            if (orderStatus && orderStatus !== 'COMPLETED' && orderStatus !== 'PAID') {
                if (confirm(`Active Order is currently ${orderStatus}. Mark as PAID and Close Session?`)) {
                    try {
                        if (activeOrderId) {
                            // Mark as Paid
                            await axios.put(`${API_URL}/orders/${activeOrderId}/status`, { status: "PAID", paymentStatus: "PAID" }, { withCredentials: true });

                            // Retry Free Table
                            await axios.post(`${API_URL}/orders/free-table`, {
                                restaurantId,
                                tableId: table.id
                            }, { withCredentials: true });

                            onClose();
                            if (onUpdate) onUpdate();
                            alert("Session closed successfully");
                        } else {
                            alert("Error: Active Order ID missing. Please pay manually.");
                        }
                    } catch (retryErr) {
                        console.error("Retry failed", retryErr);
                        alert("Failed to auto-resolve. Please mark order as PAID manually.");
                    }
                }
            } else {
                alert(msg);
            }
        }
    };

    const handleResolveService = async () => {
        try {
            await axios.post(`${API_URL}/restaurants/public/${restaurantId}/table/${table.id}/service`, { active: false });
            if (onUpdate) onUpdate();
            // Don't close modal necessarily, user might want to do other things
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-4 bg-secondary/50 border-b border-border flex justify-between items-center shrink-0">
                    <h3 className="font-bold flex items-center gap-2">
                        Manage Table {table.number}
                        {table.requestService && <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">Needs Service</span>}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTableOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No active orders for this table.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeTableOrders.map((order) => (
                                <div key={order._id} className="bg-secondary/20 border border-border rounded-xl p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-mono text-xs text-muted-foreground">#{order._id.slice(-4)}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'READY' ? 'bg-green-100 text-green-700' :
                                            order.status === 'SERVED' ? 'bg-purple-100 text-purple-700' :
                                                order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1 mb-3">
                                        {order.items?.map((item, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-foreground/90">{item.quantity}x {item.name}</span>
                                                <span className="font-medium text-muted-foreground">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                        <span className="font-bold text-sm">₹{order.totalAmount}</span>
                                        {order.status === 'READY' && (
                                            <button
                                                onClick={() => handleMarkServed(order._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                                            >
                                                <CheckCircle size={12} /> Serve
                                            </button>
                                        )}
                                        {order.status !== 'PAID' && order.status !== 'SERVED' && (
                                            <span className="text-[10px] text-muted-foreground italic">Prepare & Serve first</span>
                                        )}
                                        {/* Status specific indicators */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-card border-t border-border shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] shrink-0 space-y-3">
                    {activeTableOrders.length > 0 && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground font-medium">Total Bill</span>
                            <span className="text-2xl font-bold">₹{totalAmount}</span>
                        </div>
                    )}

                    {hasUnpaid && (
                        <div className="space-y-2">
                            {unservedCount > 0 && (
                                <div className="text-xs text-amber-600 font-bold text-center bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-center gap-1">
                                    <AlertCircle size={14} />
                                    Serve {unservedCount} remaining order{unservedCount !== 1 ? 's' : ''} to enable payment
                                </div>
                            )}
                            <button
                                onClick={handleMarkTablePaid}
                                disabled={unservedCount > 0}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all
                                ${unservedCount > 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]'
                                    }`}
                            >
                                <DollarSign size={20} /> Collect Payment & Mark Paid
                            </button>
                        </div>
                    )}

                    {allPaid && (
                        <div className="w-full py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-2">
                            <CheckCircle size={20} /> All Orders Paid
                        </div>
                    )}

                    {table.requestService && (
                        <button
                            onClick={handleResolveService}
                            className="w-full mb-1 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 py-2.5 rounded-xl font-bold transition-colors"
                        >
                            Mark Request Addressed
                        </button>
                    )}

                    {table.isOccupied && (
                        <button
                            onClick={handleFreeTable}
                            className="w-full bg-red-500/10 text-red-600 hover:bg-red-500/20 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={18} /> Close Session & Free Table
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
