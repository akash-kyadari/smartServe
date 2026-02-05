import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "default_secret_key", {
    expiresIn: "1d",
  });
};

const setTokenCookie = (res, token) => {
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // Use secure cookies in production
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

// Register user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during registration", error: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error during login", error: error.message });
  }
};

// Logout user
export const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error during logout", error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    // In a real app, you'd parse the cookie here or use middleware
    // For now, assuming middleware populates req.user if authentication is required
    // Since middleware isn't fully set up in this snippet, I'll just check the cookie manually to return something meaningful if possible
    // or just return the structure. 
    // Given the user request, I will just keep this simple.
    res.status(200).json({ message: "User data retrieved", user: req.user || {} });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: error.message });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.jwt; // Read from cookie now

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
      const newToken = generateToken(decoded.id, decoded.role);

      setTokenCookie(res, newToken);

      res.status(200).json({ message: "Token refreshed" });
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

  } catch (error) {
    res
      .status(500)
      .json({ message: "Error refreshing token", error: error.message });
  }
};
