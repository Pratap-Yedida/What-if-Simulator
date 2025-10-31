import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// GET /api/v1/users/profile
router.get('/profile', asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Get user profile
  res.status(501).json({
    message: 'Get user profile endpoint - Coming soon',
    endpoint: 'GET /api/v1/users/profile',
  });
}));

// PUT /api/v1/users/profile
router.put('/profile', asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Update user profile
  res.status(501).json({
    message: 'Update user profile endpoint - Coming soon',
    endpoint: 'PUT /api/v1/users/profile',
  });
}));

// GET /api/v1/users/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Get user by ID (public profile)
  res.status(501).json({
    message: 'Get user by ID endpoint - Coming soon',
    endpoint: `GET /api/v1/users/${req.params['id']}`,
  });
}));

// DELETE /api/v1/users/account
router.delete('/account', asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Delete user account
  res.status(501).json({
    message: 'Delete user account endpoint - Coming soon',
    endpoint: 'DELETE /api/v1/users/account',
  });
}));

// GET /api/v1/users/stories
router.get('/stories', asyncHandler(async (_req: Request, res: Response) => {
  // TODO: Get user's stories
  res.status(501).json({
    message: 'Get user stories endpoint - Coming soon',
    endpoint: 'GET /api/v1/users/stories',
  });
}));

export default router;
