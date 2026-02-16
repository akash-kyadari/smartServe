import { Server } from "socket.io";
import http from "http";
import Restaurant from "../models/RestaurantModel.js";
import express from "express";
import User from "../models/UserModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL,
            "http://localhost:3000",
            "https://smart-serve-app.netlify.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
});

// Helper to check if user is connected
const isUserConnected = (restaurantId, userId) => {
    // If not userId, return false
    if (!userId || !restaurantId) return false;

    // Check if socket with this userId exists in the room
    const roomId = `restro_staff_${restaurantId}`;
    const room = io.sockets.adapter.rooms.get(roomId);

    if (!room) return false;

    for (const socketId of room) {
        const socket = io.sockets.sockets.get(socketId);
        // Compare as string to be safe
        if (socket && socket.userId && socket.userId.toString() === userId.toString()) {
            return true;
        }
    }
    return false;
};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join Restaurant Staff Room (Kitchen, Waiter, Manager)
    socket.on("join_staff_room", async (data) => {
        let restroId, userId;

        // Parse Data
        if (typeof data === 'string') {
            restroId = data;
        } else if (typeof data === 'object' && data !== null) {
            restroId = data.restaurantId || data.restroId;
            userId = data.userId;
        }

        if (!restroId) {
            console.error("Join Room Failed: No Restaurant ID");
            return;
        }

        // Set properties BEFORE joining rooms to avoid race conditions
        if (userId) {
            socket.userId = userId;
            socket.restroId = restroId;
            // Also join user specific room for messaging
            socket.join(`user_${userId}`);
        }

        socket.join(`restro_staff_${restroId}`);
        console.log(`Socket ${socket.id} joined staff room: restro_staff_${restroId}`);

        if (userId) {
            // Mark Online in DB
            try {
                // Must match the element in the array
                await Restaurant.updateOne(
                    { _id: restroId, "staff.user": userId },
                    { $set: { "staff.$.isActive": true } }
                );

                // Broadcast
                io.to(`restro_staff_${restroId}`).emit("staff_update", {
                    staffId: userId,
                    isActive: true
                });
            } catch (err) {
                console.error("Socket Connect Error (DB Update):", err);
            }
        }
    });

    // Join Table Room (Customer)
    socket.on("join_table_room", ({ restroId, tableId }) => {
        const roomName = `table_${restroId}_${tableId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined table room: ${roomName}`);
    });

    // Join Public Room (Restaurant Wide Status Updates)
    socket.on("join_public_room", (restroId) => {
        socket.join(`restro_public_${restroId}`);
        console.log(`Socket ${socket.id} joined public room: restro_public_${restroId}`);
    });

    // Join Owner Room (Private Updates like Reviews)
    socket.on("join_owner_room", (restroId) => {
        socket.join(`restro_owner_${restroId}`);
        console.log(`Socket ${socket.id} joined owner room: restro_owner_${restroId}`);
    });

    // Handle Disconnect
    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);

        if (socket.userId && socket.restroId) {
            const roomId = `restro_staff_${socket.restroId}`;
            const room = io.sockets.adapter.rooms.get(roomId);
            let stillConnected = false;

            if (room) {
                for (const sid of room) {
                    // In socket.io v4+, io.sockets.sockets is a Map
                    const s = io.sockets.sockets.get(sid);
                    // Check if another socket exists for the same user ID
                    // We must ensure we don't count the current disconnecting socket
                    if (s && s.userId && s.userId.toString() === socket.userId.toString() && s.id !== socket.id) {
                        stillConnected = true;
                        break;
                    }
                }
            }

            if (!stillConnected) {
                // DEBOUNCE OFFLINE STATUS: Wait 5 seconds to handle page refreshes
                // or temporary network blips.
                setTimeout(async () => {
                    // console.log(`Checking connection status for user ${socket.userId} after grace period...`);
                    try {
                        const isNowConnected = isUserConnected(socket.restroId, socket.userId);

                        if (!isNowConnected) {
                            console.log(`User ${socket.userId} confirmed offline after grace period.`);
                            await Restaurant.updateOne(
                                { _id: socket.restroId, "staff.user": socket.userId },
                                { $set: { "staff.$.isActive": false } }
                            );

                            io.to(roomId).emit("staff_update", {
                                staffId: socket.userId,
                                isActive: false
                            });
                        } else {
                            console.log(`User ${socket.userId} re-connected during grace period. Aborting offline update.`);
                        }
                    } catch (err) {
                        console.error("Error setting staff status to offline:", err);
                    }
                }, 5000);
            } else {
                console.log(`User ${socket.userId} still has active tabs. Status kept Online.`);
            }
        }
    });
});


export { app, io, server, isUserConnected };
