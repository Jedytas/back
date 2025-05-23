  const express = require("express");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const User = require("../models/user");
  const authMiddleware = require("../middleware/authMiddleware");
  const { body, validationResult } = require('express-validator'); 

  const router = express.Router();

  const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
  };

  // REGISTER
  router.post(
    "/register",
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format").notEmpty().withMessage("Email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      try {
        let user = await User.findOne({ email });
        if (user) {
           return res.status(409).json({ message: "Mail already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
      } catch (error) {
        console.error("Error:", error);
        res.status(400).json({ message: "Validation failed", error: error.message });
      }
    }
  );

  // LOGIN
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

      const { accessToken, refreshToken } = generateTokens(user);
      res.json({ accessToken, refreshToken });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // REFRESH TOKEN
  router.post("/refresh-token", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(401).json({ message: "Refresh token is required" });

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "Invalid refresh token" });

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  });

  // PROTECTED ROUTE
  router.get("/profile", authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  module.exports = router;
