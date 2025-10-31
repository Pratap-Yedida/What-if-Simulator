import { LogicalGenerator } from './LogicalGenerator';
import { CreativeGenerator } from './CreativeGenerator';
import { RankingAlgorithm } from './RankingAlgorithm';
import { logger } from '@/utils/logger';

export interface SimulatorParameters {
  character?: {
    name: string;
    traits: string[];
  };
  setting?: {
    era?: string;
    place?: string;
    mood?: string;
  };
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
  branch_density?: 'low' | 'medium' | 'high';
  perspective?: 'single' | 'dual' | 'multiple';
  theme_keywords?: string[];
  audience_age?: string;
}

export interface GeneratedPrompt {
  id: string;
  prompt_text: string;
  type: 'logical' | 'creative' | 'twist' | 'character' | 'thematic';
  tags: string[];
  impact: number;
  confidence_score: number;
  template_used?: string;
  generation_method: 'rule-based' | 'llm' | 'hybrid';
  explainability: {
    rule_applied?: string;
    template_id?: string;
    reasoning?: string;
  };
}

export interface BranchSuggestion {
  id: string;
  branch_text: string;
  branch_type: 'character-driven' | 'plot-twist' | 'moral-dilemma' | 'procedural' | 'escalation' | 'de-escalation';
  impact_score: number;
  estimated_outcome_summary: string;
  generation_method: 'rule-based' | 'llm' | 'hybrid';
  explainability: {
    rule_applied?: string;
    entities_used?: string[];
    reasoning?: string;
  };
}

export interface SimulatorConfig {
  defaultPromptCount: number;
  defaultBranchCount: number;
  maxPromptCount: number;
  maxBranchCount: number;
  safetyEnabled: boolean;
  diversityThreshold: number;
  relevanceThreshold: number;
  llmEnabled: boolean;
  llmModel: string;
  llmMaxTokens: number;
}

export class SimulatorEngine {
  private logicalGenerator: LogicalGenerator;
  private creativeGenerator: CreativeGenerator;
  private rankingAlgorithm: RankingAlgorithm;
  private config: SimulatorConfig;

  constructor(config: SimulatorConfig) {
    this.config = config;
    this.logicalGenerator = new LogicalGenerator();
    this.creativeGenerator = new CreativeGenerator(config.llmEnabled);
    this.rankingAlgorithm = new RankingAlgorithm();

    logger.info('Simulator engine initialized', {
      llmEnabled: config.llmEnabled,
      safetyEnabled: config.safetyEnabled,
      diversityThreshold: config.diversityThreshold,
    });
  }

  /**
   * Generate "What if" prompts based on input parameters
   */
  async generatePrompts(parameters: SimulatorParameters): Promise<GeneratedPrompt[]> {
    try {
      const startTime = Date.now();
      logger.info('Starting prompt generation', { parameters });

      // Validate and normalize parameters
      const normalizedParams = this.normalizeParameters(parameters);
      
      // Determine generation counts based on mode
      const counts = this.determineGenerationCounts(normalizedParams);
      
      // Generate candidates from both engines
      const candidates: GeneratedPrompt[] = [];

      // Logical generation
      if (counts.logical > 0) {
        const logicalPrompts = await this.logicalGenerator.generatePrompts(
          normalizedParams, 
          counts.logical
        );
        candidates.push(...logicalPrompts);
      }

      // Creative generation
      if (counts.creative > 0) {
        const creativePrompts = await this.creativeGenerator.generatePrompts(
          normalizedParams, 
          counts.creative
        );
        candidates.push(...creativePrompts);
      }

      // Apply safety filters if enabled
      const safeCandidates = this.config.safetyEnabled 
        ? await this.applySafetyFilters(candidates, normalizedParams)
        : candidates;

      // Rank and diversify results
      const rankedPrompts = await this.rankingAlgorithm.rankPrompts(
        safeCandidates,
        normalizedParams,
        {
          diversityThreshold: this.config.diversityThreshold,
          relevanceThreshold: this.config.relevanceThreshold,
        }
      );

      // Limit results
      const finalPrompts = rankedPrompts.slice(0, this.config.defaultPromptCount);

      const duration = Date.now() - startTime;
      logger.info('Prompt generation completed', {
        inputParams: Object.keys(parameters).length,
        candidatesGenerated: candidates.length,
        finalPrompts: finalPrompts.length,
        duration,
      });

      return finalPrompts;
    } catch (error) {
      logger.error('Prompt generation failed', { error, parameters });
      throw new Error('Failed to generate prompts');
    }
  }

  /**
   * Generate branch suggestions for a story node
   */
  async generateBranches(
    nodeContent: string,
    storyParams: SimulatorParameters,
    branchDensity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<BranchSuggestion[]> {
    try {
      const startTime = Date.now();
      logger.info('Starting branch generation', { 
        nodeContentLength: nodeContent.length,
        branchDensity,
        storyParams: Object.keys(storyParams).length,
      });

      // Normalize parameters
      const normalizedParams = { ...storyParams, branch_density: branchDensity };
      
      // Determine branch count based on density
      const branchCount = this.getBranchCount(branchDensity);
      const logicalCount = Math.ceil(branchCount * 0.6);
      const creativeCount = branchCount - logicalCount;

      // Generate candidates
      const candidates: BranchSuggestion[] = [];

      // Logical branch generation
      if (logicalCount > 0) {
        const logicalBranches = await this.logicalGenerator.generateBranches(
          nodeContent,
          normalizedParams,
          logicalCount
        );
        candidates.push(...logicalBranches);
      }

      // Creative branch generation
      if (creativeCount > 0) {
        const creativeBranches = await this.creativeGenerator.generateBranches(
          nodeContent,
          normalizedParams,
          creativeCount
        );
        candidates.push(...creativeBranches);
      }

      // Apply safety filters
      const safeCandidates = this.config.safetyEnabled
        ? await this.applySafetyFiltersForBranches(candidates, normalizedParams)
        : candidates;

      // Rank branches
      const rankedBranches = await this.rankingAlgorithm.rankBranches(
        safeCandidates,
        nodeContent,
        normalizedParams
      );

      const duration = Date.now() - startTime;
      logger.info('Branch generation completed', {
        candidatesGenerated: candidates.length,
        finalBranches: rankedBranches.length,
        duration,
      });

      return rankedBranches.slice(0, branchCount);
    } catch (error) {
      logger.error('Branch generation failed', { error, nodeContentLength: nodeContent.length });
      throw new Error('Failed to generate branches');
    }
  }

  /**
   * Get engine health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    components: {
      logical_generator: 'healthy' | 'degraded' | 'down';
      creative_generator: 'healthy' | 'degraded' | 'down';
      ranking_algorithm: 'healthy' | 'degraded' | 'down';
      llm_service: 'healthy' | 'degraded' | 'down' | 'disabled';
    };
    metrics: {
      average_response_time: number;
      success_rate: number;
      last_error?: string;
    };
  }> {
    try {
      const [logicalHealth, creativeHealth, rankingHealth] = await Promise.all([
        this.logicalGenerator.getHealthStatus(),
        this.creativeGenerator.getHealthStatus(),
        this.rankingAlgorithm.getHealthStatus(),
      ]);

      const overallStatus = this.calculateOverallHealth([
        logicalHealth.status,
        creativeHealth.status,
        rankingHealth.status,
      ]);

      return {
        status: overallStatus,
        components: {
          logical_generator: logicalHealth.status,
          creative_generator: creativeHealth.status,
          ranking_algorithm: rankingHealth.status,
          llm_service: this.config.llmEnabled ? creativeHealth.llm_status || 'down' : 'disabled',
        },
        metrics: {
          average_response_time: (
            logicalHealth.average_response_time +
            creativeHealth.average_response_time +
            rankingHealth.average_response_time
          ) / 3,
          success_rate: Math.min(
            logicalHealth.success_rate,
            creativeHealth.success_rate,
            rankingHealth.success_rate
          ),
        },
      };
    } catch (error) {
      logger.error('Health check failed', { error });
      return {
        status: 'down',
        components: {
          logical_generator: 'down',
          creative_generator: 'down',
          ranking_algorithm: 'down',
          llm_service: 'down',
        },
        metrics: {
          average_response_time: 0,
          success_rate: 0,
          last_error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Normalize input parameters
   */
  private normalizeParameters(parameters: SimulatorParameters): SimulatorParameters {
    return {
      character: parameters.character ? {
        name: parameters.character.name.trim(),
        traits: parameters.character.traits.map(trait => trait.toLowerCase().trim()).slice(0, 3),
      } : undefined,
      setting: parameters.setting,
      event: parameters.event?.trim(),
      genre: this.normalizeGenre(parameters.genre),
      tone: this.normalizeTone(parameters.tone),
      constraints: parameters.constraints,
      mode: parameters.mode || 'balanced',
      branch_density: parameters.branch_density || 'medium',
      perspective: parameters.perspective || 'single',
      theme_keywords: parameters.theme_keywords?.map(keyword => keyword.toLowerCase().trim()),
      audience_age: parameters.audience_age,
    };
  }

  /**
   * Normalize genre names (map synonyms)
   */
  private normalizeGenre(genre?: string): string | undefined {
    if (!genre) return undefined;

    const genreMap: Record<string, string> = {
      'sf': 'sci-fi',
      'science-fiction': 'sci-fi',
      'scifi': 'sci-fi',
      'fantasy': 'fantasy',
      'mystery': 'mystery',
      'thriller': 'thriller',
      'horror': 'horror',
      'romance': 'romance',
      'drama': 'drama',
      'comedy': 'comedy',
      'historical': 'historical',
      'slice-of-life': 'slice-of-life',
      'adventure': 'adventure',
    };

    return genreMap[genre.toLowerCase()] || genre.toLowerCase();
  }

  /**
   * Normalize tone names
   */
  private normalizeTone(tone?: string): string | undefined {
    if (!tone) return undefined;

    const toneMap: Record<string, string> = {
      'funny': 'humorous',
      'scary': 'tense',
      'sad': 'bleak',
      'happy': 'whimsical',
      'serious': 'dramatic',
      'light': 'whimsical',
      'dark': 'bleak',
    };

    return toneMap[tone.toLowerCase()] || tone.toLowerCase();
  }

  /**
   * Determine generation counts based on mode
   */
  private determineGenerationCounts(parameters: SimulatorParameters): { logical: number; creative: number } {
    const total = this.config.defaultPromptCount;
    
    switch (parameters.mode) {
      case 'logical':
        return { logical: total, creative: 0 };
      case 'creative':
        return { logical: 0, creative: total };
      case 'balanced':
      default:
        return { 
          logical: Math.ceil(total * 0.6), 
          creative: Math.floor(total * 0.4) 
        };
    }
  }

  /**
   * Get branch count based on density
   */
  private getBranchCount(density: 'low' | 'medium' | 'high'): number {
    switch (density) {
      case 'low': return 2;
      case 'medium': return 4;
      case 'high': return 6;
      default: return 4;
    }
  }

  /**
   * Apply safety filters to prompts
   */
  private async applySafetyFilters(
    prompts: GeneratedPrompt[], 
    parameters: SimulatorParameters
  ): Promise<GeneratedPrompt[]> {
    // TODO: Implement actual safety filtering
    // For now, just return the prompts as-is
    logger.debug('Safety filters applied', { promptCount: prompts.length });
    return prompts;
  }

  /**
   * Apply safety filters to branches
   */
  private async applySafetyFiltersForBranches(
    branches: BranchSuggestion[], 
    parameters: SimulatorParameters
  ): Promise<BranchSuggestion[]> {
    // TODO: Implement actual safety filtering
    logger.debug('Safety filters applied to branches', { branchCount: branches.length });
    return branches;
  }

  /**
   * Calculate overall health from component health statuses
   */
  private calculateOverallHealth(statuses: ('healthy' | 'degraded' | 'down')[]): 'healthy' | 'degraded' | 'down' {
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy';
    }
    if (statuses.some(status => status === 'down')) {
      return 'down';
    }
    return 'degraded';
  }
}
