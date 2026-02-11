import { Server } from "socket.io";
import http from "http";
import express from "express";
import Restaurant from "../models/RestaurantModel.js";
import User from "../models/UserModel.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"], // Allow frontend
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join Restaurant Staff Room (Kitchen, Waiter, Manager)
    socket.on("join_staff_room", async (data) => {
        let restroId, userId;

        if (typeof data === 'string') {
            restroId = data;
        } else {
            restroId = data.restaurantId;
            userId = data.userId;
        }

        socket.join(`restro_staff_${restroId}`);
        console.log(`Socket ${socket.id} joined staff room: restro_staff_${restroId}`);

        if (userId) {
            // Attach metadata to socket for cleanup
            socket.userId = userId;
            socket.restroId = restroId;

            // Join a private user room to track active tabs
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined user room: user_${userId}`);
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

    // Handle Disconnect
    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);

        // removed auto-offline logic on disconnect to prevent status flickering on refresh
        // Users must create explicit "Go Offline" action or rely on session timeout (future improvement)
    });
});

export { app, io, server };
