import { Server } from "socket.io";
import http from "http";
import express from "express";

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
    socket.on("join_staff_room", (restroId) => {
        socket.join(`restro_staff_${restroId}`);
        console.log(`Socket ${socket.id} joined staff room: restro_staff_${restroId}`);
    });

    // Join Table Room (Customer)
    socket.on("join_table_room", ({ restroId, tableId }) => {
        const roomName = `table_${restroId}_${tableId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined table room: ${roomName}`);
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

export { app, io, server };
