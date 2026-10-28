import express from 'express';
import {
  registerUser,
  registerAdmin,
  loginUser,
  getProtectedProfile,
  getAdminResource,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// @route   POST /api/users/register
router.post('/register', authLimiter, validateRegister, registerUser);

// @route   POST /api/users/register-admin  (dev/test only — requires X-Admin-Secret header)
router.post('/register-admin', registerAdmin);

// @route   POST /api/users/login
router.post('/login', authLimiter, validateLogin, loginUser);

// @route   GET /api/users/profile
router.get('/profile', authMiddleware, getProtectedProfile);

// @route   GET /api/users/admin
router.get('/admin', authMiddleware, requireAdmin, getAdminResource);

export default router;
