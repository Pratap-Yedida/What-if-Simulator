import { logger } from '@/utils/logger';
import type { SimulatorParameters, GeneratedPrompt, BranchSuggestion } from './SimulatorEngine';

export interface RankingConfig {
  diversityThreshold: number;
  relevanceThreshold: number;
  noveltyWeight: number;
  relevanceWeight: number;
  safetyWeight: number;
  impactWeight: number;
}

export interface EmbeddingVector {
  text: string;
  vector: number[];
  magnitude: number;
}

export interface RankingMetrics {
  relevanceScore: number;
  noveltyScore: number;
  safetyScore: number;
  impactScore: number;
  diversityBonus: number;
  finalScore: number;
}

export class RankingAlgorithm {
  private config: RankingConfig;
  private healthMetrics: {
    successCount: number;
    errorCount: number;
    totalResponseTime: number;
    requestCount: number;
  };

  constructor(config?: Partial<RankingConfig>) {
    this.config = {
      diversityThreshold: 0.3,
      relevanceThreshold: 0.5,
      noveltyWeight: 0.3,
      relevanceWeight: 0.4,
      safetyWeight: 0.2,
      impactWeight: 0.1,
      ...config,
    };

    this.healthMetrics = {
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      requestCount: 0,
    };

    logger.info('Ranking algorithm initialized', { config: this.config });
  }

  /**
   * Rank and diversify generated prompts
   */
  async rankPrompts(
    prompts: GeneratedPrompt[],
    parameters: SimulatorParameters,
    options: { diversityThreshold: number; relevanceThreshold: number }
  ): Promise<GeneratedPrompt[]> {
    const startTime = Date.now();
    
    try {
      this.healthMetrics.requestCount++;

      if (prompts.length === 0) {
        return [];
      }

      // Calculate embeddings for input parameters and prompts
      const inputEmbedding = await this.createParameterEmbedding(parameters);
      const promptEmbeddings = await Promise.all(
        prompts.map(prompt => this.createTextEmbedding(prompt.prompt_text))
      );

      // Calculate ranking metrics for each prompt
      const rankedPrompts = await Promise.all(
        prompts.map(async (prompt, index) => {
          const metrics = await this.calculateRankingMetrics(
            prompt,
            promptEmbeddings[index],
            inputEmbedding,
            promptEmbeddings,
            parameters
          );

          return {
            ...prompt,
            _rankingMetrics: metrics,
            _finalScore: metrics.finalScore,
          };
        })
      );

      // Sort by final score (descending)
      rankedPrompts.sort((a, b) => (b._finalScore || 0) - (a._finalScore || 0));

      // Apply diversity filtering
      const diversifiedPrompts = this.applyDiversityFilter(
        rankedPrompts,
        promptEmbeddings,
        options.diversityThreshold
      );

      // Remove ranking metadata before returning
      const finalPrompts = diversifiedPrompts.map(prompt => {
        const { _rankingMetrics, _finalScore, ...cleanPrompt } = prompt as any;
        return cleanPrompt as GeneratedPrompt;
      });

      this.healthMetrics.successCount++;
      const responseTime = Date.now() - startTime;
      this.healthMetrics.totalResponseTime += responseTime;

      logger.debug('Prompts ranked and diversified', {
        inputCount: prompts.length,
        outputCount: finalPrompts.length,
        responseTime,
      });

      return finalPrompts;
    } catch (error) {
      this.healthMetrics.errorCount++;
      logger.error('Prompt ranking failed', { error, promptCount: prompts.length });
      throw error;
    }
  }

  /**
   * Rank branch suggestions
   */
  async rankBranches(
    branches: BranchSuggestion[],
    nodeContent: string,
    parameters: SimulatorParameters
  ): Promise<BranchSuggestion[]> {
    const startTime = Date.now();
    
    try {
      this.healthMetrics.requestCount++;

      if (branches.length === 0) {
        return [];
      }

      // Create embeddings
      const nodeEmbedding = await this.createTextEmbedding(nodeContent);
      const branchEmbeddings = await Promise.all(
        branches.map(branch => this.createTextEmbedding(branch.branch_text))
      );

      // Calculate metrics and rank
      const rankedBranches = await Promise.all(
        branches.map(async (branch, index) => {
          const metrics = await this.calculateBranchMetrics(
            branch,
            branchEmbeddings[index],
            nodeEmbedding,
            branchEmbeddings,
            parameters
          );

          return {
            ...branch,
            _rankingMetrics: metrics,
            _finalScore: metrics.finalScore,
          };
        })
      );

      // Sort by final score
      rankedBranches.sort((a, b) => (b._finalScore || 0) - (a._finalScore || 0));

      // Apply diversity filtering
      const diversifiedBranches = this.applyBranchDiversityFilter(
        rankedBranches,
        branchEmbeddings
      );

      // Clean up metadata
      const finalBranches = diversifiedBranches.map(branch => {
        const { _rankingMetrics, _finalScore, ...cleanBranch } = branch as any;
        return cleanBranch as BranchSuggestion;
      });

      this.healthMetrics.successCount++;
      const responseTime = Date.now() - startTime;
      this.healthMetrics.totalResponseTime += responseTime;

      logger.debug('Branches ranked and diversified', {
        inputCount: branches.length,
        outputCount: finalBranches.length,
        responseTime,
      });

      return finalBranches;
    } catch (error) {
      this.healthMetrics.errorCount++;
      logger.error('Branch ranking failed', { error, branchCount: branches.length });
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    success_rate: number;
    average_response_time: number;
    error_count: number;
  }> {
    const successRate = this.healthMetrics.requestCount > 0 
      ? (this.healthMetrics.successCount / this.healthMetrics.requestCount) * 100 
      : 100;
    
    const averageResponseTime = this.healthMetrics.requestCount > 0
      ? this.healthMetrics.totalResponseTime / this.healthMetrics.requestCount
      : 0;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (successRate < 50) {
      status = 'down';
    } else if (successRate < 80 || averageResponseTime > 1000) {
      status = 'degraded';
    }

    return {
      status,
      success_rate: successRate,
      average_response_time: averageResponseTime,
      error_count: this.healthMetrics.errorCount,
    };
  }

  /**
   * Create embedding from story parameters
   */
  private async createParameterEmbedding(parameters: SimulatorParameters): Promise<EmbeddingVector> {
    const textParts = [
      parameters.character?.name,
      ...(parameters.character?.traits || []),
      parameters.setting?.era,
      parameters.setting?.place,
      parameters.setting?.mood,
      parameters.event,
      parameters.genre,
      parameters.tone,
      ...(parameters.theme_keywords || []),
    ].filter(Boolean);

    const text = textParts.join(' ');
    return this.createTextEmbedding(text);
  }

  /**
   * Create simple text embedding (TF-IDF-like approach)
   */
  private async createTextEmbedding(text: string): Promise<EmbeddingVector> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Create word frequency map
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Create a simple vector based on word frequencies
    // In a real implementation, you'd use pre-trained embeddings
    const vocabulary = this.getVocabulary();
    const vector = vocabulary.map(word => wordFreq[word] || 0);
    
    // Calculate magnitude for normalization
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

    return {
      text,
      vector: magnitude > 0 ? vector.map(val => val / magnitude) : vector,
      magnitude,
    };
  }

  /**
   * Calculate ranking metrics for a prompt
   */
  private async calculateRankingMetrics(
    prompt: GeneratedPrompt,
    promptEmbedding: EmbeddingVector,
    inputEmbedding: EmbeddingVector,
    allPromptEmbeddings: EmbeddingVector[],
    parameters: SimulatorParameters
  ): Promise<RankingMetrics> {
    // Relevance score (cosine similarity with input)
    const relevanceScore = this.cosineSimilarity(promptEmbedding, inputEmbedding);

    // Novelty score (average distance from other prompts)
    const noveltyScore = this.calculateNoveltyScore(promptEmbedding, allPromptEmbeddings);

    // Safety score (placeholder - would use actual content moderation)
    const safetyScore = this.calculateSafetyScore(prompt, parameters);

    // Impact score (from generation or calculated)
    const impactScore = prompt.impact || 0.5;

    // Diversity bonus (for varied content)
    const diversityBonus = this.calculateDiversityBonus(prompt, parameters);

    // Calculate final score using weighted combination
    const finalScore = (
      relevanceScore * this.config.relevanceWeight +
      noveltyScore * this.config.noveltyWeight +
      safetyScore * this.config.safetyWeight +
      impactScore * this.config.impactWeight
    ) * (1 + diversityBonus);

    return {
      relevanceScore,
      noveltyScore,
      safetyScore,
      impactScore,
      diversityBonus,
      finalScore: Math.min(finalScore, 1.0), // Cap at 1.0
    };
  }

  /**
   * Calculate ranking metrics for a branch
   */
  private async calculateBranchMetrics(
    branch: BranchSuggestion,
    branchEmbedding: EmbeddingVector,
    nodeEmbedding: EmbeddingVector,
    allBranchEmbeddings: EmbeddingVector[],
    parameters: SimulatorParameters
  ): Promise<RankingMetrics> {
    // Relevance to current node
    const relevanceScore = this.cosineSimilarity(branchEmbedding, nodeEmbedding);

    // Novelty compared to other branches
    const noveltyScore = this.calculateNoveltyScore(branchEmbedding, allBranchEmbeddings);

    // Safety score
    const safetyScore = this.calculateBranchSafetyScore(branch, parameters);

    // Impact score from branch
    const impactScore = branch.impact_score || 0.5;

    // Branch type bonus
    const diversityBonus = this.calculateBranchDiversityBonus(branch, parameters);

    const finalScore = (
      relevanceScore * this.config.relevanceWeight +
      noveltyScore * this.config.noveltyWeight +
      safetyScore * this.config.safetyWeight +
      impactScore * this.config.impactWeight
    ) * (1 + diversityBonus);

    return {
      relevanceScore,
      noveltyScore,
      safetyScore,
      impactScore,
      diversityBonus,
      finalScore: Math.min(finalScore, 1.0),
    };
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(embedding1: EmbeddingVector, embedding2: EmbeddingVector): number {
    if (embedding1.vector.length !== embedding2.vector.length) {
      return 0;
    }

    const dotProduct = embedding1.vector.reduce(
      (sum, val, index) => sum + val * embedding2.vector[index],
      0
    );

    return Math.max(0, dotProduct); // Ensure non-negative
  }

  /**
   * Calculate novelty score (average distance from other embeddings)
   */
  private calculateNoveltyScore(
    embedding: EmbeddingVector,
    otherEmbeddings: EmbeddingVector[]
  ): number {
    if (otherEmbeddings.length <= 1) {
      return 1.0; // Maximum novelty if no other embeddings
    }

    const similarities = otherEmbeddings
      .filter(other => other !== embedding)
      .map(other => this.cosineSimilarity(embedding, other));

    const averageSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    
    // Novelty is inverse of similarity
    return Math.max(0, 1 - averageSimilarity);
  }

  /**
   * Calculate safety score (placeholder implementation)
   */
  private calculateSafetyScore(prompt: GeneratedPrompt, parameters: SimulatorParameters): number {
    // Simple rule-based safety check
    const unsafeWords = ['violence', 'harm', 'hate', 'explicit'];
    const promptText = prompt.prompt_text.toLowerCase();
    
    const unsafeCount = unsafeWords.reduce(
      (count, word) => count + (promptText.includes(word) ? 1 : 0),
      0
    );

    // Age-appropriate filtering
    const ageRating = parameters.audience_age;
    let ageMultiplier = 1.0;
    if (ageRating && ageRating.includes('10-12') && unsafeCount > 0) {
      ageMultiplier = 0.5;
    }

    return Math.max(0.1, (1 - unsafeCount * 0.3) * ageMultiplier);
  }

  /**
   * Calculate safety score for branches
   */
  private calculateBranchSafetyScore(branch: BranchSuggestion, parameters: SimulatorParameters): number {
    // Similar to prompt safety but for branches
    const unsafeWords = ['violence', 'harm', 'hate', 'explicit'];
    const branchText = branch.branch_text.toLowerCase();
    
    const unsafeCount = unsafeWords.reduce(
      (count, word) => count + (branchText.includes(word) ? 1 : 0),
      0
    );

    return Math.max(0.1, 1 - unsafeCount * 0.3);
  }

  /**
   * Calculate diversity bonus for prompts
   */
  private calculateDiversityBonus(prompt: GeneratedPrompt, parameters: SimulatorParameters): number {
    let bonus = 0;

    // Bonus for creative types
    if (prompt.type === 'creative' || prompt.type === 'twist') {
      bonus += 0.1;
    }

    // Bonus for genre-appropriate content
    if (parameters.genre && prompt.tags.includes(parameters.genre)) {
      bonus += 0.05;
    }

    // Bonus for high confidence
    if (prompt.confidence_score > 0.8) {
      bonus += 0.05;
    }

    return Math.min(bonus, 0.3); // Cap diversity bonus
  }

  /**
   * Calculate diversity bonus for branches
   */
  private calculateBranchDiversityBonus(branch: BranchSuggestion, parameters: SimulatorParameters): number {
    let bonus = 0;

    // Bonus for different branch types
    const branchTypeBonus: Record<string, number> = {
      'plot-twist': 0.15,
      'moral-dilemma': 0.12,
      'character-driven': 0.08,
      'procedural': 0.05,
      'escalation': 0.10,
      'de-escalation': 0.07,
    };

    bonus += branchTypeBonus[branch.branch_type] || 0;

    // Bonus for high impact
    if (branch.impact_score > 0.8) {
      bonus += 0.1;
    }

    return Math.min(bonus, 0.3);
  }

  /**
   * Apply diversity filtering to prompts
   */
  private applyDiversityFilter(
    prompts: any[],
    embeddings: EmbeddingVector[],
    threshold: number
  ): any[] {
    if (prompts.length <= 1) {
      return prompts;
    }

    const filtered = [prompts[0]]; // Always include the best one
    const selectedEmbeddings = [embeddings[0]];

    for (let i = 1; i < prompts.length; i++) {
      const currentEmbedding = embeddings[i];
      
      // Check if current prompt is diverse enough from selected ones
      const similarities = selectedEmbeddings.map(selected => 
        this.cosineSimilarity(currentEmbedding, selected)
      );
      
      const maxSimilarity = Math.max(...similarities);
      
      if (maxSimilarity < (1 - threshold)) {
        filtered.push(prompts[i]);
        selectedEmbeddings.push(currentEmbedding);
      }
    }

    return filtered;
  }

  /**
   * Apply diversity filtering to branches
   */
  private applyBranchDiversityFilter(
    branches: any[],
    embeddings: EmbeddingVector[]
  ): any[] {
    // Similar to prompt diversity but with different threshold
    return this.applyDiversityFilter(branches, embeddings, 0.4);
  }

  /**
   * Get vocabulary for embedding creation
   */
  private getVocabulary(): string[] {
    // Simple vocabulary for demonstration
    // In production, you'd use a much larger vocabulary
    return [
      'character', 'story', 'plot', 'conflict', 'resolution', 'mystery', 'adventure',
      'love', 'fear', 'hope', 'betrayal', 'discovery', 'journey', 'quest', 'magic',
      'technology', 'future', 'past', 'present', 'time', 'space', 'world', 'reality',
      'dream', 'nightmare', 'hero', 'villain', 'friend', 'enemy', 'family', 'stranger',
      'decision', 'choice', 'consequence', 'change', 'growth', 'loss', 'victory',
      'defeat', 'beginning', 'end', 'middle', 'twist', 'reveal', 'secret', 'truth',
      'lie', 'deception', 'honesty', 'courage', 'cowardice', 'wisdom', 'folly',
      'power', 'weakness', 'strength', 'fragility', 'light', 'darkness', 'shadow',
    ];
  }
}
