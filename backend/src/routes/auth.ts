import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as authController from '@/controllers/authController';

const router = Router();

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated routes (require login)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/refresh', authenticate, authController.refreshToken);

export default router;