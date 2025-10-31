import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as simulatorController from '@/controllers/simulatorController';

const router = Router();

// Public endpoints (no authentication required)
router.get('/health', simulatorController.getHealth);

// Authenticated endpoints (require login)
router.post('/generate', authenticate, simulatorController.generateContent);
router.post('/simulate', authenticate, simulatorController.simulateStory);
router.get('/results/:id', authenticate, simulatorController.getSimulationResults);

export default router;
