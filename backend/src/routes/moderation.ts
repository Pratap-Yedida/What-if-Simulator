import { Router } from 'express';
import { authenticate, adminOnly } from '@/middleware/auth';
import * as moderationController from '@/controllers/moderationController';

const router = Router();

// Public routes (no authentication required)
router.post('/moderate/text', moderationController.moderateText);
router.post('/moderate/story', moderationController.moderateStory);
router.post('/moderate/prompt', moderationController.moderatePrompt);

// Authenticated routes (require login)
router.get('/filters', moderationController.getFilters);
router.post('/report', authenticate, moderationController.reportContent);

// Admin routes (require admin access)
router.put('/filters', authenticate, adminOnly, moderationController.updateFilters);
router.get('/stats', authenticate, adminOnly, moderationController.getModerationStats);
router.get('/queue', authenticate, adminOnly, moderationController.getModerationQueue);
router.put('/queue/:reportId/resolve', authenticate, adminOnly, moderationController.resolveModerationReport);

export default router;
