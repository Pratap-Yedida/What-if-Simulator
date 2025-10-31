import { Request, Response, NextFunction } from 'express';
import { contentModerationService, ModerationResult } from '@/services/contentModerationService';
import { logger } from '@/utils/logger';
import { AuthenticationError } from '@/middleware/errorHandler';

/**
 * Moderate text content
 */
export const moderateText = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { content, contentType = 'story' } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Content is required and must be a string',
      });
      return;
    }

    if (content.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Content too long - maximum 10,000 characters',
      });
      return;
    }

    const result = await contentModerationService.moderateText(content, contentType);

    logger.info('Text content moderated', {
      contentLength: content.length,
      contentType,
      isApproved: result.isApproved,
      confidence: result.confidence,
      flagCount: result.flags.length,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Text moderation failed', { error });
    next(error);
  }
};

/**
 * Moderate story content
 */
export const moderateStory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, nodes, branches } = req.body;

    if (!title || typeof title !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Story title is required',
      });
      return;
    }

    if (!Array.isArray(nodes)) {
      res.status(400).json({
        success: false,
        error: 'Story nodes are required',
      });
      return;
    }

    const storyData = {
      title,
      description: description || '',
      nodes: nodes || [],
      branches: branches || [],
    };

    const result = await contentModerationService.moderateStory(storyData);

    logger.info('Story content moderated', {
      title: title.substring(0, 50),
      nodeCount: nodes.length,
      branchCount: branches?.length || 0,
      isApproved: result.isApproved,
      confidence: result.confidence,
      flagCount: result.flags.length,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Story moderation failed', { error });
    next(error);
  }
};

/**
 * Moderate AI-generated prompt
 */
export const moderatePrompt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { promptText, context } = req.body;

    if (!promptText || typeof promptText !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Prompt text is required',
      });
      return;
    }

    const result = await contentModerationService.moderatePrompt(promptText, context);

    logger.info('Prompt moderated', {
      promptLength: promptText.length,
      isApproved: result.isApproved,
      confidence: result.confidence,
      flagCount: result.flags.length,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Prompt moderation failed', { error });
    next(error);
  }
};

/**
 * Get moderation filters
 */
export const getFilters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = contentModerationService.getFilters();

    res.json({
      success: true,
      filters,
    });
  } catch (error) {
    logger.error('Failed to get moderation filters', { error });
    next(error);
  }
};

/**
 * Update moderation filters (admin only)
 */
export const updateFilters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Check if user is admin (simplified check)
    if (req.user.subscriptionTier !== 'enterprise' && req.user.username !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { filters } = req.body;

    if (!filters || typeof filters !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Filters object is required',
      });
      return;
    }

    contentModerationService.updateFilters(filters);

    logger.info('Moderation filters updated', {
      updatedBy: req.user.userId,
      filters,
    });

    res.json({
      success: true,
      message: 'Moderation filters updated successfully',
      filters: contentModerationService.getFilters(),
    });
  } catch (error) {
    logger.error('Failed to update moderation filters', { error });
    next(error);
  }
};

/**
 * Get moderation statistics
 */
export const getModerationStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Check if user is admin
    if (req.user.subscriptionTier !== 'enterprise' && req.user.username !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    // Mock statistics - in real app, this would come from database
    const stats = {
      totalModerated: 1250,
      approved: 1100,
      rejected: 150,
      pendingReview: 25,
      flaggedContent: 75,
      categories: {
        violence: 45,
        adult_content: 30,
        hate_speech: 5,
        spam: 20,
        copyright: 10,
        inappropriate: 15,
      },
      averageConfidence: 0.85,
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get moderation statistics', { error });
    next(error);
  }
};

/**
 * Report content for moderation
 */
export const reportContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const { contentId, contentType, reason, description } = req.body;

    if (!contentId || !contentType || !reason) {
      res.status(400).json({
        success: false,
        error: 'Content ID, type, and reason are required',
      });
      return;
    }

    const validReasons = [
      'inappropriate', 'violence', 'hate_speech', 'adult_content',
      'spam', 'copyright', 'harassment', 'other'
    ];

    if (!validReasons.includes(reason)) {
      res.status(400).json({
        success: false,
        error: 'Invalid reason provided',
      });
      return;
    }

    // In real app, this would save the report to database
    logger.info('Content reported', {
      contentId,
      contentType,
      reason,
      reportedBy: req.user.userId,
      description: description?.substring(0, 200),
    });

    res.json({
      success: true,
      message: 'Content reported successfully. Our moderation team will review it.',
    });
  } catch (error) {
    logger.error('Failed to report content', { error });
    next(error);
  }
};

/**
 * Get content moderation queue (admin only)
 */
export const getModerationQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Check if user is admin
    if (req.user.subscriptionTier !== 'enterprise' && req.user.username !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { page = 1, limit = 20, status = 'pending' } = req.query;

    // Mock moderation queue - in real app, this would come from database
    const queue = [
      {
        id: 'mod_001',
        contentId: 'story_123',
        contentType: 'story',
        title: 'The Dark Forest',
        content: 'A mysterious story about...',
        reportedBy: 'user_456',
        reason: 'violence',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
      },
      {
        id: 'mod_002',
        contentId: 'node_789',
        contentType: 'node',
        title: 'Chapter 3',
        content: 'The protagonist discovers...',
        reportedBy: 'user_789',
        reason: 'adult_content',
        status: 'pending',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
      },
    ];

    res.json({
      success: true,
      queue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: queue.length,
        totalPages: Math.ceil(queue.length / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Failed to get moderation queue', { error });
    next(error);
  }
};

/**
 * Resolve moderation report (admin only)
 */
export const resolveModerationReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Check if user is admin
    if (req.user.subscriptionTier !== 'enterprise' && req.user.username !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { reportId } = req.params;
    const { action, reason, notes } = req.body;

    const validActions = ['approve', 'reject', 'remove', 'warn'];

    if (!validActions.includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Invalid action provided',
      });
      return;
    }

    // In real app, this would update the report in database
    logger.info('Moderation report resolved', {
      reportId,
      action,
      reason,
      resolvedBy: req.user.userId,
      notes: notes?.substring(0, 200),
    });

    res.json({
      success: true,
      message: `Report ${action}d successfully`,
    });
  } catch (error) {
    logger.error('Failed to resolve moderation report', { error });
    next(error);
  }
};
