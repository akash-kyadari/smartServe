"use client";
import { CheckCircle, Clock, ChefHat, Utensils } from "lucide-react";

export default function OrderTracker({ order }) {
    const STATUS_CONFIG = {
        PLACED: { label: "Order Sent", description: "Waiting for confirmation", icon: CheckCircle, progress: 10, color: "text-blue-500", bg: "bg-blue-500" },
        PREPARING: { label: "Preparing", description: "Kitchen is cooking your meal", icon: ChefHat, progress: 45, color: "text-orange-500", bg: "bg-orange-500" },
        READY: { label: "Ready to Serve", description: "Waiter is bringing your food", icon: Utensils, progress: 80, color: "text-green-500", bg: "bg-green-500" },
        SERVED: { label: "Served", description: "Enjoy your meal!", icon: CheckCircle, progress: 100, color: "text-primary", bg: "bg-primary" },
        COMPLETED: { label: "Completed", description: "Session ended", icon: CheckCircle, progress: 100, color: "text-gray-500", bg: "bg-gray-500" },
    };

    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
    const Icon = config.icon;

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/60 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${config.bg}/10 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-base ${config.color}`}>{config.label}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{config.description}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="font-mono text-xs text-muted-foreground block">#{order._id.slice(-4)}</span>
                    <span className="font-bold text-sm">₹{order.totalAmount}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-5">
                <div
                    className={`h-full ${config.bg} transition-all duration-1000 ease-out`}
                    style={{ width: `${config.progress}%` }}
                />
            </div>

            {/* Items List */}
            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold text-muted-foreground bg-background px-1.5 rounded textxs tabular-nums w-5 text-center">{item.quantity}</span>
                            <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground tabular-nums">₹{item.price * item.quantity}</span>
                    </div>
                ))}
            </div>

            {/* Addons or Notes could go here */}
        </div>
    );
}
