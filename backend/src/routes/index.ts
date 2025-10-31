import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import storyRoutes from './stories';
import simulatorRoutes from './simulator';
import analyticsRoutes from './analytics';
import moderationRoutes from './moderation';

const router = Router();

// Base API route
router.get('/', (req, res) => {
  res.json({
    message: 'What-If Storytelling Simulator API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
});

// Mount route handlers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stories', storyRoutes);
router.use('/simulator', simulatorRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/moderation', moderationRoutes);

export default router;
