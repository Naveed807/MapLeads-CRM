import { Router } from 'express';
import { authController } from '../../app/controllers/AuthController';
import { authMiddleware } from '../../app/middleware/auth';
import { validate } from '../../app/middleware/validate';
import { authRateLimiter } from '../../app/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@mapleads/shared';

const router = Router();

// Public — rate-limited
router.post('/register',       authRateLimiter, validate(registerSchema),        authController.register.bind(authController));
router.post('/login',          authRateLimiter, validate(loginSchema),            authController.login.bind(authController));
router.post('/refresh',        authRateLimiter,                                   authController.refresh.bind(authController));
router.post('/forgot-password',authRateLimiter, validate(forgotPasswordSchema),   authController.forgotPassword.bind(authController));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema),    authController.resetPassword.bind(authController));

// Protected
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.get('/me',      authMiddleware, authController.me.bind(authController));

export default router;
