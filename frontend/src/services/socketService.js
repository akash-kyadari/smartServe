import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        if (this.socket && this.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.connected = true;
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
        }
    }

    // Join restaurant public room (for customers viewing restaurant)
    joinRestaurantRoom(restaurantId) {
        if (this.socket && restaurantId) {
            this.socket.emit('join_public_room', restaurantId);
            console.log(`Joined restaurant room: ${restaurantId}`);
        }
    }

    // Join staff room (for restaurant staff)
    joinStaffRoom(restaurantId, userId) {
        if (this.socket && restaurantId) {
            this.socket.emit('join_staff_room', { restaurantId, userId });
            console.log(`Joined staff room: ${restaurantId}`);
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
            this.socket.on('table:unavailable', callback);
        }
    }

    onTableAvailable(callback) {
        if (this.socket) {
            this.socket.on('table:available', callback);
        }
    }

    // Remove listeners
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
