import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

// In-memory storage for now (replace with database later)
interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  authorId: string;
  authorName: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived';
}

// Mock data storage
let stories: Story[] = [];
let nextId = 1;

/**
 * Get all public stories
 * GET /api/v1/stories
 */
export const getStories = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, category, search, authorId } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  
  // If filtering by authorId and user is authenticated, show all their stories (including private)
  // Otherwise, only show public stories
  let filteredStories: Story[];
  if (authorId && req.user && req.user.userId === authorId) {
    // User is viewing their own stories - show all (public and private)
    filteredStories = stories.filter(story => story.authorId === authorId);
  } else {
    // Public stories only
    filteredStories = stories.filter(story => story.isPublic);
    
    // Filter by author (if authorId is provided, show their public stories)
    if (authorId) {
      filteredStories = filteredStories.filter(story => story.authorId === authorId);
    }
  }
  
  // Filter by category
  if (category) {
    filteredStories = filteredStories.filter(story => 
      story.category.toLowerCase().includes((category as string).toLowerCase())
    );
  }
  
  // Filter by search term
  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filteredStories = filteredStories.filter(story => 
      story.title.toLowerCase().includes(searchTerm) ||
      story.description.toLowerCase().includes(searchTerm) ||
      story.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  // Pagination
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedStories = filteredStories.slice(startIndex, endIndex);
  
  return res.json({
    success: true,
    data: paginatedStories,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: filteredStories.length,
      pages: Math.ceil(filteredStories.length / limitNum)
    }
  });
});

/**
 * Get a specific story
 * GET /api/v1/stories/:id
 */
export const getStory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = stories.find(s => s.id === id);
  
  if (!story) {
    return res.status(404).json({
      success: false,
      message: 'Story not found'
    });
  }
  
  // Check if user can access the story
  if (!story.isPublic && (!req.user || story.authorId !== req.user.userId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  return res.json({
    success: true,
    data: story
  });
});

/**
 * Create a new story
 * POST /api/v1/stories
 */
export const createStory = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, content = '', isPublic = false, tags = [], category = 'General' } = req.body;
  
  // Validation
  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required'
    });
  }
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Create new story
  const newStory: Story = {
    id: nextId.toString(),
    title: title.trim(),
    description: description.trim(),
    content: content.trim(),
    authorId: req.user.userId,
    authorName: req.user.username || 'Unknown',
    isPublic: Boolean(isPublic),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: Array.isArray(tags) ? tags : [],
    category: category.trim() || 'General',
    status: 'draft'
  };
  
  stories.push(newStory);
  nextId++;
  
  return res.status(201).json({
    success: true,
    data: newStory,
    message: 'Story created successfully'
  });
});

/**
 * Update a story
 * PUT /api/v1/stories/:id
 */
export const updateStory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, content, isPublic, tags, category, status } = req.body;
  
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Story not found'
    });
  }
  
  const story = stories[storyIndex];
  
  if (!story) {
    return res.status(404).json({
      success: false,
      message: 'Story not found'
    });
  }
  
  // Check if user can update the story
  if (!req.user || story.authorId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // Update story fields
  if (title !== undefined) story.title = title.trim();
  if (description !== undefined) story.description = description.trim();
  if (content !== undefined) story.content = content.trim();
  if (isPublic !== undefined) story.isPublic = Boolean(isPublic);
  if (tags !== undefined) story.tags = Array.isArray(tags) ? tags : [];
  if (category !== undefined) story.category = category.trim() || 'General';
  if (status !== undefined) story.status = status;
  
  story.updatedAt = new Date().toISOString();
  
  return res.json({
    success: true,
    data: story,
    message: 'Story updated successfully'
  });
});

/**
 * Delete a story
 * DELETE /api/v1/stories/:id
 */
export const deleteStory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Story not found'
    });
  }
  
  const story = stories[storyIndex];
  
  if (!story) {
    return res.status(404).json({
      success: false,
      message: 'Story not found'
    });
  }
  
  // Check if user can delete the story
  if (!req.user || story.authorId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // Remove story
  stories.splice(storyIndex, 1);
  
  return res.json({
    success: true,
    message: 'Story deleted successfully'
  });
});

/**
 * Get story nodes
 * GET /api/v1/stories/:id/nodes
 */
export const getStoryNodes = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: 'Story nodes feature coming soon'
  });
});

/**
 * Create a story node
 * POST /api/v1/stories/:id/nodes
 */
export const createStoryNode = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: null,
    message: 'Story nodes feature coming soon'
  });
});

/**
 * Update a story node
 * PUT /api/v1/stories/:id/nodes/:nodeId
 */
export const updateStoryNode = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: null,
    message: 'Story nodes feature coming soon'
  });
});

/**
 * Delete a story node
 * DELETE /api/v1/stories/:id/nodes/:nodeId
 */
export const deleteStoryNode = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: null,
    message: 'Story nodes feature coming soon'
  });
});

/**
 * Get story branches
 * GET /api/v1/stories/:id/branches
 */
export const getStoryBranches = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [],
    message: 'Story branches feature coming soon'
  });
});

/**
 * Create a story branch
 * POST /api/v1/stories/:id/branches
 */
export const createStoryBranch = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: null,
    message: 'Story branches feature coming soon'
  });
});

/**
 * Update a story branch
 * PUT /api/v1/stories/:id/branches/:branchId
 */
export const updateStoryBranch = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: null,
    message: 'Story branches feature coming soon'
  });
});

/**
 * Delete a story branch
 * DELETE /api/v1/stories/:id/branches/:branchId
 */
export const deleteStoryBranch = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: null,
    message: 'Story branches feature coming soon'
  });
});