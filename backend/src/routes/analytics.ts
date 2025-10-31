import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as analyticsController from '@/controllers/analyticsController';

const router = Router();

// Public routes (no authentication required)
router.post('/track', analyticsController.trackEvent);

// Authenticated routes (require login)
router.get('/user/:userId', authenticate, analyticsController.getUserAnalytics);
router.get('/story/:storyId', analyticsController.getStoryAnalytics);
router.get('/dashboard', authenticate, analyticsController.getDashboard);

export default router;