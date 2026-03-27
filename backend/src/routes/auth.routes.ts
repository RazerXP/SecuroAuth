import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { rateLimitLogin, rateLimitSignup, rateLimitForgotPassword, rateLimitResetPassword } from '../middleware/rateLimit.middleware.js';

const router = Router();

// public routes
router.post('/signup', rateLimitSignup, AuthController.signup);
router.post('/login', rateLimitLogin, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', rateLimitForgotPassword, AuthController.forgotPassword);
router.post('/reset-password', rateLimitResetPassword, AuthController.resetPassword);

// protected routes
router.get('/me', authenticateToken, AuthController.getMe);

export default router;