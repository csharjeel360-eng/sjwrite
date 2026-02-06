 import express from 'express';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = express.Router();

// ✅ Admin Registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Create new admin
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();

    // Generate token (7 days)
    const token = jwt.sign({ id: newAdmin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Save active token and last login to enforce single-session
    newAdmin.activeToken = token;
    newAdmin.lastLogin = new Date();
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully', token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Admin Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if admin exists
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password using model helper
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token (7 days)
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Save active token and update last login - this invalidates any previous token
    admin.activeToken = token;
    admin.lastLogin = new Date();
    await admin.save();

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;