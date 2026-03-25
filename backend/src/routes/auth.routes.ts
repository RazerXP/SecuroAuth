import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimitLogin, rateLimitSignup } from '../middleware/rateLimit.middleware.js';

const router = Router();

// public routes
router.post('/signup', rateLimitSignup, AuthController.signup);
router.post('/login', rateLimitLogin, AuthController.login);

// protected routes
router.post('/refresh', authenticateToken, AuthController.refreshToken);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);

// TODO: Password reset
// router.post('/forgot-password', AuthController.forgotPassword);
// router.post('/reset-password', AuthController.resetPassword);

export default router;