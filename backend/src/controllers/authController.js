import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const generateToken = (id, roles) => {
  return jwt.sign({ id, roles }, process.env.JWT_SECRET || "default_secret_key", {
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

    // Determine initial role
    // Only allow "customer" or "owner" for public registration
    // Prevent "admin", "manager", "waiter", "kitchen" from being self-assigned
    const allowedRoles = ["customer", "owner"];
    const requestedRole = role && allowedRoles.includes(role) ? role : "customer";
    const initialRoles = [requestedRole];

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      roles: initialRoles,
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id, newUser.roles);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        roles: newUser.roles,
      },
    });
  } catch (error) {
    console.log("Error in registerUser:", error.message);
    res
      .status(500)
      .json({ message: "Error during registration", error: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

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

    // Find user in database and include password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Handle Role Logic
    if (role) {
      if (role === 'owner') {
        // Only allow upgrade if user is strictly a customer (no staff roles)
        const hasStaffRoles = user.roles.some(r => ['manager', 'waiter', 'kitchen', 'staff', 'admin'].includes(r));

        if (hasStaffRoles) {
          return res.status(403).json({
            message: "Staff members cannot login as owners with the same account. Please use a separate account."
          });
        }

        // Allow auto-upgrade for pure customers
        if (!user.roles.includes('owner')) {
          user.roles.push('owner');
          await user.save();
        }
      }
      // For staff roles, we just check if they have it.
      else if (['waiter', 'kitchen', 'manager', 'staff'].includes(role)) {
        if (!user.roles.includes(role)) {
          return res.status(403).json({
            message: `Access denied. You are not authorized as a ${role}.`
          });
        }
      }
    }

    // Generate token with (potentially updated) role
    const token = generateToken(user._id, user.roles);

    // Set cookie
    setTokenCookie(res, token);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        workingAt: user.workingAt,
      },
    });
  } catch (error) {
    console.log("Error in loginUser:", error.message);
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
    console.log("Error in logoutUser:", error.message);
    res.status(500).json({ message: "Error during logout", error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({ message: "User data retrieved", user: req.user });
  } catch (error) {
    console.log("Error in getCurrentUser:", error.message);
    res
      .status(500)
      .json({ message: "Error retrieving user", error: error.message });
  }
};


