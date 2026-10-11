import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @route   POST /api/users/register
// @desc    Register a new user (always defaults to role: 'user')
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user — enforce role: 'user' for public registration
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/login
// @desc    Authenticate user & get JWT token
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/profile
// @desc    Get current authenticated user profile
// @access  Private (JWT Token Required)
export const getProtectedProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/admin
// @desc    Get admin-only resource
// @access  Private/Admin (JWT Token + Admin Role Required)
// @route   POST /api/users/register-admin
// @desc    Create an admin user — requires server-side ADMIN_SECRET header
// @access  Protected by ADMIN_SECRET env variable (NOT public)
export const registerAdmin = async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];

    if (!adminSecret || adminSecret !== process.env.ADMIN_CREATION_SECRET) {
      return res.status(403).json({ message: 'Forbidden: Invalid admin secret' });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/admin
// @desc    Get admin-only resource
// @access  Private/Admin (JWT Token + Admin Role Required)
export const getAdminResource = async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'Admin resource accessed successfully',
      accessedBy: req.user.id,
    });
  } catch (error) {
    next(error);
  }
};
