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
import { requireAdminCreationSecret } from '../middleware/adminSecretMiddleware.js';
import { requireDatabase } from '../middleware/databaseMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// @route   POST /api/users/register
router.post('/register', authLimiter, validateRegister, requireDatabase, registerUser);

// @route   POST /api/users/register-admin
// The secret is checked before the database guard so an unauthorised request is
// rejected with 403 without depending on MongoDB availability.
router.post('/register-admin', requireAdminCreationSecret, requireDatabase, registerAdmin);

// @route   POST /api/users/login
router.post('/login', authLimiter, validateLogin, requireDatabase, loginUser);

// @route   GET /api/users/profile
router.get('/profile', authMiddleware, requireDatabase, getProtectedProfile);

// @route   GET /api/users/admin
router.get('/admin', authMiddleware, requireAdmin, getAdminResource);

export default router;
