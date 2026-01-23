import express from "express";
import authRouter from "./routers/authRouter.js";

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Auth routes
app.use("/api/auth", authRouter);
app.listen(3000, () => {
  console.log("server is running on port 3000");
});
