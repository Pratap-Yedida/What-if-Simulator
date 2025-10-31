import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '@/middleware/auth';
import * as storyController from '@/controllers/storyController';

const router = Router();

// Public routes (can be accessed without authentication, but may show limited data)
router.get('/', optionalAuthenticate, storyController.getStories);
router.get('/:id', optionalAuthenticate, storyController.getStory);

// Authenticated routes (require login)
router.post('/', authenticate, storyController.createStory);
router.put('/:id', authenticate, storyController.updateStory);
router.delete('/:id', authenticate, storyController.deleteStory);

// Story Nodes Routes (require authentication)
router.get('/:id/nodes', authenticate, storyController.getStoryNodes);
router.post('/:id/nodes', authenticate, storyController.createStoryNode);
router.put('/:id/nodes/:nodeId', authenticate, storyController.updateStoryNode);
router.delete('/:id/nodes/:nodeId', authenticate, storyController.deleteStoryNode);

// Story Branches Routes (require authentication)
router.get('/:id/branches', authenticate, storyController.getStoryBranches);
router.post('/:id/branches', authenticate, storyController.createStoryBranch);
router.put('/:id/branches/:branchId', authenticate, storyController.updateStoryBranch);
router.delete('/:id/branches/:branchId', authenticate, storyController.deleteStoryBranch);

// TODO: Implement collaboration endpoints
// router.get('/:id/collaborators', authenticate, storyController.getCollaborators);
// router.post('/:id/collaborators', authenticate, storyController.addCollaborator);
// router.delete('/:id/collaborators/:userId', authenticate, storyController.removeCollaborator);

export default router;
