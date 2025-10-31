import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import type { SimulatorParameters, GeneratedPrompt, BranchSuggestion } from './SimulatorEngine';

export interface ConceptPair {
  concept1: string;
  concept2: string;
  distance: number;
  blend_potential: number;
}

export interface AntiTemplate {
  id: string;
  genre: string;
  expected_pattern: string;
  violation_pattern: string;
  surprise_factor: number;
}

export interface CreativeRule {
  id: string;
  name: string;
  type: 'concept_blending' | 'anti_template' | 'character_conflict' | 'associative_chain';
  weight: number;
  applicability: (params: SimulatorParameters) => boolean;
}

export class CreativeGenerator {
  private llmEnabled: boolean;
  private conceptDatabase: string[];
  private antiTemplates: AntiTemplate[];
  private creativeRules: CreativeRule[];
  private healthMetrics: {
    successCount: number;
    errorCount: number;
    totalResponseTime: number;
    requestCount: number;
    llmRequestCount: number;
    llmErrorCount: number;
  };

  constructor(llmEnabled: boolean = false) {
    this.llmEnabled = llmEnabled;
    this.healthMetrics = {
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      requestCount: 0,
      llmRequestCount: 0,
      llmErrorCount: 0,
    };

    this.initializeConceptDatabase();
    this.initializeAntiTemplates();
    this.initializeCreativeRules();

    logger.info('Creative generator initialized', {
      llmEnabled: this.llmEnabled,
      conceptsCount: this.conceptDatabase.length,
      antiTemplatesCount: this.antiTemplates.length,
    });
  }

  /**
   * Generate creative prompts using heuristics and optionally LLM
   */
  async generatePrompts(parameters: SimulatorParameters, count: number): Promise<GeneratedPrompt[]> {
    const startTime = Date.now();
    
    try {
      this.healthMetrics.requestCount++;
      
      const prompts: GeneratedPrompt[] = [];
      
      // Use different creative techniques
      const techniques = [
        'concept_blending',
        'anti_template',
        'character_conflict',
        'associative_chain',
      ];

      // Generate prompts using creative techniques
      for (let i = 0; i < count; i++) {
        const technique = techniques[i % techniques.length];
        const prompt = await this.generatePromptWithTechnique(technique, parameters);
        
        if (prompt) {
          prompts.push(prompt);
        }
      }

      // If LLM is enabled and we have fewer prompts than requested, augment with LLM
      if (this.llmEnabled && prompts.length < count) {
        const remainingCount = count - prompts.length;
        const llmPrompts = await this.generateLLMPrompts(parameters, remainingCount);
        prompts.push(...llmPrompts);
      }

      this.healthMetrics.successCount++;
      const responseTime = Date.now() - startTime;
      this.healthMetrics.totalResponseTime += responseTime;

      logger.debug('Creative prompts generated', {
        count: prompts.length,
        requestedCount: count,
        responseTime,
        llmUsed: this.llmEnabled,
      });

      return prompts;
    } catch (error) {
      this.healthMetrics.errorCount++;
      logger.error('Creative prompt generation failed', { error, parameters, count });
      throw error;
    }
  }

  /**
   * Generate creative branch suggestions
   */
  async generateBranches(
    nodeContent: string,
    parameters: SimulatorParameters,
    count: number
  ): Promise<BranchSuggestion[]> {
    const startTime = Date.now();
    
    try {
      this.healthMetrics.requestCount++;
      
      const branches: BranchSuggestion[] = [];
      
      // Creative branching techniques
      const techniques = [
        'unexpected_twist',
        'perspective_shift',
        'genre_blend',
        'temporal_anomaly',
        'reality_break',
      ];

      for (let i = 0; i < count; i++) {
        const technique = techniques[i % techniques.length];
        const branch = await this.generateCreativeBranch(technique, nodeContent, parameters);
        
        if (branch) {
          branches.push(branch);
        }
      }

      // Augment with LLM if enabled
      if (this.llmEnabled && branches.length < count) {
        const remainingCount = count - branches.length;
        const llmBranches = await this.generateLLMBranches(nodeContent, parameters, remainingCount);
        branches.push(...llmBranches);
      }

      this.healthMetrics.successCount++;
      const responseTime = Date.now() - startTime;
      this.healthMetrics.totalResponseTime += responseTime;

      logger.debug('Creative branches generated', {
        count: branches.length,
        requestedCount: count,
        responseTime,
      });

      return branches;
    } catch (error) {
      this.healthMetrics.errorCount++;
      logger.error('Creative branch generation failed', { error, nodeContent: nodeContent.substring(0, 100) });
      throw error;
    }
  }

  /**
   * Get health status including LLM status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    success_rate: number;
    average_response_time: number;
    error_count: number;
    llm_status?: 'healthy' | 'degraded' | 'down';
    llm_success_rate?: number;
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
    } else if (successRate < 80 || averageResponseTime > 3000) {
      status = 'degraded';
    }

    const result: any = {
      status,
      success_rate: successRate,
      average_response_time: averageResponseTime,
      error_count: this.healthMetrics.errorCount,
    };

    // Add LLM health if enabled
    if (this.llmEnabled) {
      const llmSuccessRate = this.healthMetrics.llmRequestCount > 0
        ? ((this.healthMetrics.llmRequestCount - this.healthMetrics.llmErrorCount) / this.healthMetrics.llmRequestCount) * 100
        : 100;

      result.llm_status = llmSuccessRate >= 80 ? 'healthy' : llmSuccessRate >= 50 ? 'degraded' : 'down';
      result.llm_success_rate = llmSuccessRate;
    }

    return result;
  }

  /**
   * Initialize concept database for blending
   */
  private initializeConceptDatabase(): void {
    this.conceptDatabase = [
      // Abstract concepts
      'time', 'memory', 'dreams', 'fear', 'hope', 'love', 'betrayal', 'sacrifice',
      'freedom', 'identity', 'truth', 'illusion', 'power', 'wisdom', 'chaos', 'order',
      
      // Concrete objects
      'mirror', 'key', 'door', 'book', 'photograph', 'letter', 'clock', 'mask',
      'bridge', 'labyrinth', 'garden', 'storm', 'fire', 'shadow', 'light', 'darkness',
      
      // Technologies
      'artificial intelligence', 'virtual reality', 'time machine', 'telepathy',
      'genetic engineering', 'quantum computing', 'neural networks', 'holograms',
      
      // Social constructs
      'democracy', 'revolution', 'tradition', 'innovation', 'community', 'isolation',
      'hierarchy', 'equality', 'justice', 'corruption', 'fame', 'anonymity',
      
      // Natural phenomena
      'gravity', 'magnetism', 'evolution', 'extinction', 'metamorphosis', 'migration',
      'symbiosis', 'adaptation', 'mutation', 'consciousness', 'instinct', 'intuition',
    ];
  }

  /**
   * Initialize anti-templates for genre violations
   */
  private initializeAntiTemplates(): void {
    this.antiTemplates = [
      {
        id: 'horror_comedy',
        genre: 'horror',
        expected_pattern: 'terrifying monster threatens protagonist',
        violation_pattern: 'monster is actually trying to help but is misunderstood',
        surprise_factor: 0.8,
      },
      {
        id: 'romance_logic',
        genre: 'romance',
        expected_pattern: 'emotional decision based on feelings',
        violation_pattern: 'relationship analyzed with pure logic and statistics',
        surprise_factor: 0.7,
      },
      {
        id: 'mystery_obvious',
        genre: 'mystery',
        expected_pattern: 'clues gradually revealed through investigation',
        violation_pattern: 'solution is immediately obvious but everyone ignores it',
        surprise_factor: 0.9,
      },
      {
        id: 'scifi_mundane',
        genre: 'sci-fi',
        expected_pattern: 'advanced technology solves problems',
        violation_pattern: 'simple everyday object becomes most important tool',
        surprise_factor: 0.8,
      },
      {
        id: 'fantasy_modern',
        genre: 'fantasy',
        expected_pattern: 'magic and mythical creatures dominate',
        violation_pattern: 'bureaucracy and paperwork control magical realm',
        surprise_factor: 0.9,
      },
    ];
  }

  /**
   * Initialize creative rules
   */
  private initializeCreativeRules(): void {
    this.creativeRules = [
      {
        id: 'concept_blend_distant',
        name: 'Distant Concept Blending',
        type: 'concept_blending',
        weight: 0.9,
        applicability: (params) => !!params.event || !!params.character,
      },
      {
        id: 'anti_genre',
        name: 'Genre Expectation Violation',
        type: 'anti_template',
        weight: 0.8,
        applicability: (params) => !!params.genre,
      },
      {
        id: 'trait_contradiction',
        name: 'Character Trait Contradiction',
        type: 'character_conflict',
        weight: 0.7,
        applicability: (params) => !!params.character && params.character.traits.length > 0,
      },
      {
        id: 'word_association',
        name: 'Associative Chain Generation',
        type: 'associative_chain',
        weight: 0.6,
        applicability: () => true, // Always applicable
      },
    ];
  }

  /**
   * Generate prompt using specific creative technique
   */
  private async generatePromptWithTechnique(
    technique: string,
    parameters: SimulatorParameters
  ): Promise<GeneratedPrompt | null> {
    try {
      let promptText: string;
      let tags: string[];
      let impactScore: number;

      switch (technique) {
        case 'concept_blending':
          const result = await this.generateConceptBlend(parameters);
          if (!result) return null;
          promptText = result.prompt;
          tags = ['concept-blend', ...result.concepts];
          impactScore = result.impact;
          break;

        case 'anti_template':
          const antiResult = await this.generateAntiTemplate(parameters);
          if (!antiResult) return null;
          promptText = antiResult.prompt;
          tags = ['anti-template', parameters.genre || 'general'];
          impactScore = antiResult.impact;
          break;

        case 'character_conflict':
          const conflictResult = await this.generateCharacterConflict(parameters);
          if (!conflictResult) return null;
          promptText = conflictResult.prompt;
          tags = ['character-conflict', 'psychological'];
          impactScore = conflictResult.impact;
          break;

        case 'associative_chain':
          const chainResult = await this.generateAssociativeChain(parameters);
          if (!chainResult) return null;
          promptText = chainResult.prompt;
          tags = ['associative', 'surreal'];
          impactScore = chainResult.impact;
          break;

        default:
          return null;
      }

      return {
        id: uuidv4(),
        prompt_text: promptText,
        type: 'creative',
        tags,
        impact: impactScore,
        confidence_score: 0.6, // Lower confidence for creative generation
        generation_method: 'rule-based',
        explainability: {
          rule_applied: technique,
          reasoning: `Generated using ${technique.replace('_', ' ')} creative technique`,
        },
      };
    } catch (error) {
      logger.error('Failed to generate creative prompt', { error, technique });
      return null;
    }
  }

  /**
   * Generate concept blending prompt
   */
  private async generateConceptBlend(
    parameters: SimulatorParameters
  ): Promise<{ prompt: string; concepts: string[]; impact: number } | null> {
    const concept1 = this.selectRandomConcept();
    const concept2 = this.selectRandomConcept(concept1);
    
    if (!concept1 || !concept2) return null;

    const event = parameters.event || 'something unexpected happens';
    const character = parameters.character?.name || 'the protagonist';

    const blendTemplates = [
      `What if ${event} caused ${concept1} and ${concept2} to merge in ways no one expected?`,
      `What if ${character} discovered that ${concept1} was secretly connected to ${concept2}?`,
      `What if the intersection of ${concept1} and ${concept2} held the key to resolving the conflict?`,
      `What if ${concept1} could only be understood through the lens of ${concept2}?`,
    ];

    const template = blendTemplates[Math.floor(Math.random() * blendTemplates.length)];
    
    return {
      prompt: template,
      concepts: [concept1, concept2],
      impact: 0.7 + Math.random() * 0.3, // 0.7-1.0 range
    };
  }

  /**
   * Generate anti-template prompt
   */
  private async generateAntiTemplate(
    parameters: SimulatorParameters
  ): Promise<{ prompt: string; impact: number } | null> {
    if (!parameters.genre) return null;

    const antiTemplate = this.antiTemplates.find(template => 
      template.genre === parameters.genre
    );

    if (!antiTemplate) return null;

    const event = parameters.event || 'the main conflict';
    const character = parameters.character?.name || 'the protagonist';

    const prompt = `What if ${event} took an unexpected turn where ${antiTemplate.violation_pattern}?`;

    return {
      prompt: prompt.replace('{character}', character),
      impact: antiTemplate.surprise_factor,
    };
  }

  /**
   * Generate character conflict prompt
   */
  private async generateCharacterConflict(
    parameters: SimulatorParameters
  ): Promise<{ prompt: string; impact: number } | null> {
    if (!parameters.character || parameters.character.traits.length === 0) return null;

    const trait = parameters.character.traits[Math.floor(Math.random() * parameters.character.traits.length)];
    const character = parameters.character.name;
    const event = parameters.event || 'faced a difficult decision';

    const conflictTemplates = [
      `What if ${character}'s ${trait} nature was put to the ultimate test when they ${event}?`,
      `What if ${character} had to act completely against their ${trait} instincts to succeed?`,
      `What if ${character} discovered that being ${trait} was actually their greatest weakness?`,
      `What if ${character}'s ${trait} trait led them to make the worst possible choice?`,
    ];

    const template = conflictTemplates[Math.floor(Math.random() * conflictTemplates.length)];

    return {
      prompt: template,
      impact: 0.8 + Math.random() * 0.2, // 0.8-1.0 range for character-driven stories
    };
  }

  /**
   * Generate associative chain prompt
   */
  private async generateAssociativeChain(
    parameters: SimulatorParameters
  ): Promise<{ prompt: string; impact: number } | null> {
    const seedWords = [
      parameters.event?.split(' ')[0],
      parameters.character?.name,
      parameters.setting?.place,
      parameters.genre,
    ].filter(Boolean);

    if (seedWords.length === 0) return null;

    const seedWord = seedWords[Math.floor(Math.random() * seedWords.length)] as string;
    const associations = this.generateWordAssociations(seedWord);
    
    if (associations.length < 2) return null;

    const association1 = associations[0];
    const association2 = associations[1];

    const prompt = `What if ${seedWord} led to ${association1}, which in turn revealed ${association2}?`;

    return {
      prompt,
      impact: 0.5 + Math.random() * 0.4, // 0.5-0.9 range
    };
  }

  /**
   * Generate creative branch suggestion
   */
  private async generateCreativeBranch(
    technique: string,
    nodeContent: string,
    parameters: SimulatorParameters
  ): Promise<BranchSuggestion | null> {
    try {
      let branchText: string;
      let branchType: BranchSuggestion['branch_type'];
      let impactScore: number;

      switch (technique) {
        case 'unexpected_twist':
          branchText = 'Discover that everything you believed was wrong';
          branchType = 'plot-twist';
          impactScore = 0.9;
          break;

        case 'perspective_shift':
          branchText = 'See the situation from a completely different viewpoint';
          branchType = 'character-driven';
          impactScore = 0.7;
          break;

        case 'genre_blend':
          branchText = 'Enter a situation that defies the normal rules of this world';
          branchType = 'plot-twist';
          impactScore = 0.8;
          break;

        case 'temporal_anomaly':
          branchText = 'Experience time in an unexpected way';
          branchType = 'plot-twist';
          impactScore = 0.8;
          break;

        case 'reality_break':
          branchText = 'Question the nature of reality itself';
          branchType = 'moral-dilemma';
          impactScore = 0.9;
          break;

        default:
          return null;
      }

      return {
        id: uuidv4(),
        branch_text: branchText,
        branch_type: branchType,
        impact_score: impactScore,
        estimated_outcome_summary: `This path leads to ${technique.replace('_', ' ')} scenarios`,
        generation_method: 'rule-based',
        explainability: {
          rule_applied: technique,
          reasoning: `Creative branch using ${technique} technique`,
        },
      };
    } catch (error) {
      logger.error('Failed to generate creative branch', { error, technique });
      return null;
    }
  }

  /**
   * Generate LLM-powered prompts (placeholder implementation)
   */
  private async generateLLMPrompts(
    parameters: SimulatorParameters,
    count: number
  ): Promise<GeneratedPrompt[]> {
    try {
      this.healthMetrics.llmRequestCount++;
      
      // TODO: Implement actual LLM integration
      logger.debug('LLM prompt generation requested but not implemented', { count });
      
      // Return empty array for now
      return [];
    } catch (error) {
      this.healthMetrics.llmErrorCount++;
      logger.error('LLM prompt generation failed', { error });
      return [];
    }
  }

  /**
   * Generate LLM-powered branches (placeholder implementation)
   */
  private async generateLLMBranches(
    nodeContent: string,
    parameters: SimulatorParameters,
    count: number
  ): Promise<BranchSuggestion[]> {
    try {
      this.healthMetrics.llmRequestCount++;
      
      // TODO: Implement actual LLM integration
      logger.debug('LLM branch generation requested but not implemented', { count });
      
      // Return empty array for now
      return [];
    } catch (error) {
      this.healthMetrics.llmErrorCount++;
      logger.error('LLM branch generation failed', { error });
      return [];
    }
  }

  /**
   * Select random concept from database
   */
  private selectRandomConcept(exclude?: string): string {
    const availableConcepts = exclude 
      ? this.conceptDatabase.filter(concept => concept !== exclude)
      : this.conceptDatabase;
    
    return availableConcepts[Math.floor(Math.random() * availableConcepts.length)];
  }

  /**
   * Generate word associations (simple implementation)
   */
  private generateWordAssociations(word: string): string[] {
    const associationMap: Record<string, string[]> = {
      'time': ['memory', 'future', 'past', 'eternity', 'moment'],
      'fear': ['courage', 'darkness', 'unknown', 'safety', 'panic'],
      'love': ['loss', 'joy', 'sacrifice', 'devotion', 'heartbreak'],
      'power': ['responsibility', 'corruption', 'freedom', 'control', 'weakness'],
      'mystery': ['truth', 'secrets', 'revelation', 'clues', 'investigation'],
      'magic': ['reality', 'wonder', 'danger', 'rules', 'consequences'],
    };

    const lowerWord = word.toLowerCase();
    return associationMap[lowerWord] || ['change', 'discovery', 'conflict', 'resolution', 'transformation'];
  }
}
