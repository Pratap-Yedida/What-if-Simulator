import { SimulatorEngine, SimulatorConfig, SimulatorParameters, GeneratedPrompt, BranchSuggestion } from '@/simulator/core/SimulatorEngine';
import { logger } from '@/utils/logger';
import { User } from '@/models/User';
import { Story } from '@/models/Story';
import { StoryNode } from '@/models/StoryNode';
import { db } from '@/database/connection';

export interface SimulatorServiceConfig extends SimulatorConfig {
  enableUsageTracking: boolean;
  enableFeedbackLearning: boolean;
}

export interface GeneratePromptsRequest {
  character?: { name: string; traits: string[] };
  setting?: { era?: string; place?: string; mood?: string };
  event?: string;
  genre?: string;
  tone?: string;
  constraints?: {
    length_target?: string;
    vocabulary_level?: string;
    banned_content?: string[];
    educational_goals?: string[];
  };
  mode?: 'logical' | 'creative' | 'balanced';
  audience_age?: string;
  theme_keywords?: string[];
}

export interface GenerateBranchesRequest {
  story_id: string;
  node_id: string;
  branch_density?: 'low' | 'medium' | 'high';
  mode?: 'logical' | 'creative' | 'balanced';
}

export interface PromptFeedbackRequest {
  prompt_id: string;
  rating: number; // 1-5
  feedback_type: 'accept' | 'edit' | 'reject';
  comments?: string;
  was_used?: boolean;
}

export class SimulatorService {
  private engine: SimulatorEngine;
  private config: SimulatorServiceConfig;

  constructor(config?: Partial<SimulatorServiceConfig>) {
    this.config = {
      defaultPromptCount: 6,
      defaultBranchCount: 4,
      maxPromptCount: 12,
      maxBranchCount: 8,
      safetyEnabled: true,
      diversityThreshold: 0.3,
      relevanceThreshold: 0.5,
      llmEnabled: process.env.LLM_ENABLED === 'true',
      llmModel: process.env.LLM_MODEL || 'gpt-3.5-turbo',
      llmMaxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
      enableUsageTracking: true,
      enableFeedbackLearning: true,
      ...config,
    };

    this.engine = new SimulatorEngine(this.config);

    logger.info('Simulator service initialized', {
      llmEnabled: this.config.llmEnabled,
      usageTracking: this.config.enableUsageTracking,
      feedbackLearning: this.config.enableFeedbackLearning,
    });
  }

  /**
   * Generate story prompts
   */
  async generatePrompts(
    request: GeneratePromptsRequest,
    userId?: string
  ): Promise<{ prompts: GeneratedPrompt[]; generation_id: string }> {
    try {
      // Convert request to simulator parameters
      const parameters: SimulatorParameters = {
        character: request.character,
        setting: request.setting,
        event: request.event,
        genre: request.genre,
        tone: request.tone,
        constraints: request.constraints,
        mode: request.mode || 'balanced',
        audience_age: request.audience_age,
        theme_keywords: request.theme_keywords,
      };

      // Generate prompts
      const prompts = await this.engine.generatePrompts(parameters);

      // Create generation ID for tracking
      const generation_id = this.generateId();

      // Track usage if enabled
      if (this.config.enableUsageTracking && userId) {
        await this.trackPromptGeneration(generation_id, userId, parameters, prompts);
      }

      logger.info('Prompts generated successfully', {
        userId,
        generation_id,
        promptCount: prompts.length,
        mode: parameters.mode,
      });

      return { prompts, generation_id };
    } catch (error) {
      logger.error('Prompt generation failed', { error, request, userId });
      throw new Error('Failed to generate prompts');
    }
  }

  /**
   * Generate branch suggestions
   */
  async generateBranches(
    request: GenerateBranchesRequest,
    userId?: string
  ): Promise<{ branches: BranchSuggestion[]; generation_id: string }> {
    try {
      // Verify user has access to the story
      if (userId) {
        const canAccess = await Story.canUserAccess(request.story_id, userId);
        if (!canAccess) {
          throw new Error('Access denied to story');
        }
      }

      // Get the story node content
      const node = await StoryNode.findById(request.node_id);
      if (!node || node.story_id !== request.story_id) {
        throw new Error('Story node not found');
      }

      // Get story details for context
      const story = await Story.findById(request.story_id, true);
      if (!story) {
        throw new Error('Story not found');
      }

      // Build parameters from story context
      const parameters: SimulatorParameters = {
        genre: story.genre || undefined,
        tone: story.tone || undefined,
        audience_age: story.audience_age || undefined,
        mode: request.mode || 'balanced',
        branch_density: request.branch_density || 'medium',
      };

      // Generate branches
      const branches = await this.engine.generateBranches(
        node.content,
        parameters,
        request.branch_density || 'medium'
      );

      // Create generation ID
      const generation_id = this.generateId();

      // Track usage
      if (this.config.enableUsageTracking && userId) {
        await this.trackBranchGeneration(generation_id, userId, request, branches);
      }

      logger.info('Branches generated successfully', {
        userId,
        generation_id,
        storyId: request.story_id,
        nodeId: request.node_id,
        branchCount: branches.length,
      });

      return { branches, generation_id };
    } catch (error) {
      logger.error('Branch generation failed', { error, request, userId });
      throw error;
    }
  }

  /**
   * Submit feedback on generated prompts
   */
  async submitPromptFeedback(
    feedback: PromptFeedbackRequest,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate feedback
      if (feedback.rating < 1 || feedback.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Store feedback in database
      if (this.config.enableUsageTracking) {
        await this.storeFeedback(feedback, userId);
      }

      // Update template effectiveness if feedback learning is enabled
      if (this.config.enableFeedbackLearning) {
        await this.updateTemplateEffectiveness(feedback);
      }

      logger.info('Prompt feedback submitted', {
        userId,
        promptId: feedback.prompt_id,
        rating: feedback.rating,
        feedbackType: feedback.feedback_type,
      });

      return {
        success: true,
        message: 'Feedback submitted successfully',
      };
    } catch (error) {
      logger.error('Feedback submission failed', { error, feedback, userId });
      throw error;
    }
  }

  /**
   * Get simulator health status
   */
  async getHealthStatus(): Promise<any> {
    return await this.engine.getHealthStatus();
  }

  /**
   * Get simulator analytics
   */
  async getAnalytics(userId?: string): Promise<{
    prompt_acceptance_rate: number;
    branch_diversity_score: number;
    user_engagement: number;
    template_effectiveness: Record<string, number>;
    recent_activity: any[];
  }> {
    try {
      // Calculate analytics from database
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const analyticsQuery = `
        SELECT 
          COUNT(CASE WHEN event_type = 'prompt_generated' THEN 1 END) as prompts_generated,
          COUNT(CASE WHEN event_type = 'prompt_accepted' THEN 1 END) as prompts_accepted,
          COUNT(CASE WHEN event_type = 'branch_selected' THEN 1 END) as branches_selected,
          COUNT(CASE WHEN event_type = 'story_created' THEN 1 END) as stories_created,
          AVG(CASE WHEN event_data->>'rating' IS NOT NULL THEN (event_data->>'rating')::numeric END) as avg_rating
        FROM user_analytics
        WHERE created_at >= $1
        ${userId ? 'AND user_id = $2' : ''}
      `;

      const params = userId ? [thirtyDaysAgo, userId] : [thirtyDaysAgo];
      const result = await db.query(analyticsQuery, params);
      const stats = result.rows[0];

      // Calculate metrics
      const promptsGenerated = parseInt(stats.prompts_generated) || 0;
      const promptsAccepted = parseInt(stats.prompts_accepted) || 0;
      const branchesSelected = parseInt(stats.branches_selected) || 0;
      const storiesCreated = parseInt(stats.stories_created) || 0;

      const promptAcceptanceRate = promptsGenerated > 0 
        ? (promptsAccepted / promptsGenerated) * 100 
        : 0;

      const userEngagement = (promptsAccepted + branchesSelected + storiesCreated) / Math.max(1, promptsGenerated);

      // Get recent activity
      const recentActivityQuery = `
        SELECT event_type, event_data, created_at
        FROM user_analytics
        WHERE created_at >= $1
        ${userId ? 'AND user_id = $2' : ''}
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const activityResult = await db.query(recentActivityQuery, params);
      const recentActivity = activityResult.rows;

      return {
        prompt_acceptance_rate: Math.round(promptAcceptanceRate * 100) / 100,
        branch_diversity_score: 0.75, // Placeholder - would calculate from embeddings
        user_engagement: Math.round(userEngagement * 100) / 100,
        template_effectiveness: {}, // Placeholder - would get from template manager
        recent_activity: recentActivity,
      };
    } catch (error) {
      logger.error('Analytics calculation failed', { error, userId });
      throw error;
    }
  }

  /**
   * Track prompt generation in database
   */
  private async trackPromptGeneration(
    generationId: string,
    userId: string,
    parameters: SimulatorParameters,
    prompts: GeneratedPrompt[]
  ): Promise<void> {
    try {
      await db.transaction(async (client) => {
        // Store generation event
        await client.query(`
          INSERT INTO user_analytics (user_id, event_type, event_data, session_id)
          VALUES ($1, $2, $3, $4)
        `, [
          userId,
          'prompt_generated',
          JSON.stringify({
            generation_id: generationId,
            parameters,
            prompt_count: prompts.length,
          }),
          generationId,
        ]);

        // Store individual prompts
        for (const prompt of prompts) {
          await client.query(`
            INSERT INTO generated_prompts (
              user_id, prompt_text, prompt_type, input_parameters,
              generation_method, impact_score, confidence_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            userId,
            prompt.prompt_text,
            prompt.type,
            JSON.stringify(parameters),
            prompt.generation_method,
            prompt.impact,
            prompt.confidence_score,
          ]);
        }
      });
    } catch (error) {
      logger.error('Failed to track prompt generation', { error, generationId });
    }
  }

  /**
   * Track branch generation in database
   */
  private async trackBranchGeneration(
    generationId: string,
    userId: string,
    request: GenerateBranchesRequest,
    branches: BranchSuggestion[]
  ): Promise<void> {
    try {
      await db.query(`
        INSERT INTO user_analytics (user_id, story_id, event_type, event_data, session_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        request.story_id,
        'branch_generated',
        JSON.stringify({
          generation_id: generationId,
          node_id: request.node_id,
          branch_density: request.branch_density,
          branch_count: branches.length,
        }),
        generationId,
      ]);
    } catch (error) {
      logger.error('Failed to track branch generation', { error, generationId });
    }
  }

  /**
   * Store feedback in database
   */
  private async storeFeedback(feedback: PromptFeedbackRequest, userId?: string): Promise<void> {
    try {
      await db.query(`
        INSERT INTO user_analytics (user_id, event_type, event_data)
        VALUES ($1, $2, $3)
      `, [
        userId,
        'prompt_feedback',
        JSON.stringify(feedback),
      ]);
    } catch (error) {
      logger.error('Failed to store feedback', { error, feedback });
    }
  }

  /**
   * Update template effectiveness based on feedback
   */
  private async updateTemplateEffectiveness(feedback: PromptFeedbackRequest): Promise<void> {
    try {
      // This would integrate with the TemplateManager to update effectiveness scores
      // For now, just log the feedback
      logger.debug('Template effectiveness feedback received', {
        promptId: feedback.prompt_id,
        rating: feedback.rating,
        feedbackType: feedback.feedback_type,
      });
    } catch (error) {
      logger.error('Failed to update template effectiveness', { error, feedback });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const simulatorService = new SimulatorService();
