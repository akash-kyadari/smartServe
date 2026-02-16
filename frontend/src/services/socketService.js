import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL;

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.currentRestroId = null; // Track current viewing room for reconnection
        this.currentStaffRoom = null; // Track staff room for reconnection
    }

    connect() {
        if (this.socket && this.connected) {
            return this.socket;
        }

        // Ensure we point to the correct Backend URL
        const url_to_use = process.env.NEXT_PUBLIC_API_URL;

        this.socket = io(url_to_use, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true // Important for cookies/cors if needed, though mostly for handshake
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.connected = true;

            // Re-join active rooms on reconnect
            if (this.currentRestroId) {
                this.joinRestaurantRoom(this.currentRestroId);
            }
            if (this.currentStaffRoom) {
                this.joinStaffRoom(this.currentStaffRoom.restaurantId, this.currentStaffRoom.userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.currentRestroId = null;
            this.currentStaffRoom = null;
        }
    }

    // Join restaurant public room (for customers viewing restaurant)
    joinRestaurantRoom(restaurantId) {
        if (this.socket && restaurantId) {
            this.currentRestroId = restaurantId;
            this.socket.emit('join_public_room', restaurantId);
            console.log(`Joined restaurant room: ${restaurantId}`);
        }
    }

    // Join staff room (for restaurant staff)
    joinStaffRoom(restaurantId, userId) {
        if (this.socket && restaurantId) {
            this.currentStaffRoom = { restaurantId, userId }; // Store for reconnection
            this.socket.emit('join_staff_room', { restaurantId, userId });
            console.log(`Joined staff room: ${restaurantId}`);
        }
    }

    // Join owner room (for real-time dashboard updates)
    joinOwnerRoom(restaurantId) {
        if (this.socket && restaurantId) {
            this.socket.emit('join_owner_room', restaurantId);
            console.log(`Joined owner room: ${restaurantId}`);
        }
    }

    // Join table room (for customers at a table)
    joinTableRoom(restaurantId, tableId) {
        if (this.socket && restaurantId && tableId) {
            this.socket.emit('join_table_room', { restroId: restaurantId, tableId });
            console.log(`Joined table room: ${restaurantId}_${tableId}`);
        }
    }

    // Listen for booking events
    onBookingCreated(callback) {
        if (this.socket) {
            this.socket.on('booking:created', callback);
        }
    }

    onBookingCancelled(callback) {
        if (this.socket) {
            this.socket.on('booking:cancelled', callback);
        }
    }

    onTableUnavailable(callback) {
        if (this.socket) {
            this.socket.on('table:unavailable', (data) => {
                console.log("Socket: table:unavailable received", data);
                callback(data);
            });
        }
    }

    onTableAvailable(callback) {
        if (this.socket) {
            this.socket.on('table:available', callback);
        }
    }

    onTableLocked(callback) {
        if (this.socket) {
            this.socket.on('table:locked', (data) => {
                console.log("Socket: table:locked received", data);
                callback(data);
            });
        }
    }

    onTableUnlocked(callback) {
        if (this.socket) {
            this.socket.on('table:unlocked', (data) => {
                console.log("Socket: table:unlocked received", data);
                callback(data);
            });
        }
    }

    // Listen for order events
    onNewOrder(callback) {
        if (this.socket) {
            this.socket.on('new_order', callback);
        }
    }

    onOrderUpdate(callback) {
        if (this.socket) {
            this.socket.on('order_update', callback);
        }
    }

    // Listen for staff/table events
    onStaffUpdate(callback) {
        if (this.socket) {
            this.socket.on('staff_update', callback);
        }
    }

    onTableFreed(callback) {
        if (this.socket) {
            this.socket.on('table_freed', callback);
        }
    }

    onTableServiceUpdate(callback) {
        if (this.socket) {
            this.socket.on('table_service_update', callback);
        }
    }

    onTableBillUpdate(callback) {
        if (this.socket) {
            this.socket.on('table_bill_update', callback);
        }
    }

    onMenuStockUpdate(callback) {
        if (this.socket) {
            this.socket.on('menu_stock_update', callback);
        }
    }

    onRestaurantStatusUpdate(callback) {
        if (this.socket) {
            this.socket.on('restaurant_status_update', callback);
        }
    }

    onReviewAdded(callback) {
        if (this.socket) {
            this.socket.on('review_added', callback);
        }
    }

    // Remove listeners
    offNewOrder(callback) {
        if (this.socket) {
            this.socket.off('new_order', callback);
        }
    }

    offOrderUpdate(callback) {
        if (this.socket) {
            this.socket.off('order_update', callback);
        }
    }

    offStaffUpdate(callback) {
        if (this.socket) {
            this.socket.off('staff_update', callback);
        }
    }

    offTableFreed(callback) {
        if (this.socket) {
            this.socket.off('table_freed', callback);
        }
    }

    offTableServiceUpdate(callback) {
        if (this.socket) {
            this.socket.off('table_service_update', callback);
        }
    }

    offTableBillUpdate(callback) {
        if (this.socket) {
            this.socket.off('table_bill_update', callback);
        }
    }

    offMenuStockUpdate(callback) {
        if (this.socket) {
            this.socket.off('menu_stock_update', callback);
        }
    }

    offRestaurantStatusUpdate(callback) {
        if (this.socket) {
            this.socket.off('restaurant_status_update', callback);
        }
    }

    offReviewAdded(callback) {
        if (this.socket) {
            this.socket.off('review_added', callback);
        }
    }

    offBookingCreated(callback) {
        if (this.socket) {
            this.socket.off('booking:created', callback);
        }
    }

    offBookingCancelled(callback) {
        if (this.socket) {
            this.socket.off('booking:cancelled', callback);
        }
    }

    offTableUnavailable(callback) {
        if (this.socket) {
            this.socket.off('table:unavailable', callback);
        }
    }

    offTableAvailable(callback) {
        if (this.socket) {
            this.socket.off('table:available', callback);
        }
    }

    offTableLocked(callback) {
        if (this.socket) {
            this.socket.off('table:locked', callback);
        }
    }

    offTableUnlocked(callback) {
        if (this.socket) {
            this.socket.off('table:unlocked', callback);
        }
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.connected;
    }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
