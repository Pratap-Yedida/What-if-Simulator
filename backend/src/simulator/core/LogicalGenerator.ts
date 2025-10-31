import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { TemplateManager } from '../templates/TemplateManager';
import { SlotFiller } from '../templates/SlotFiller';
import type { SimulatorParameters, GeneratedPrompt, BranchSuggestion } from './SimulatorEngine';

export interface LogicalRule {
  id: string;
  name: string;
  category: 'slot_permutation' | 'constraint_inversion' | 'causal_branch' | 'role_reversal' | 'temporal_displacement';
  template: string;
  parameters: string[];
  constraints?: {
    genres?: string[];
    tones?: string[];
    required_fields?: string[];
  };
  weight: number;
}

export interface ConsequenceTemplate {
  id: string;
  category: 'scientific' | 'social' | 'personal' | 'environmental' | 'economic' | 'political';
  template: string;
  parameters: string[];
  impact_range: [number, number];
}

export class LogicalGenerator {
  private templateManager: TemplateManager;
  private slotFiller: SlotFiller;
  private logicalRules: LogicalRule[];
  private consequenceTemplates: ConsequenceTemplate[];
  private healthMetrics: {
    successCount: number;
    errorCount: number;
    totalResponseTime: number;
    requestCount: number;
  };

  constructor() {
    this.templateManager = new TemplateManager();
    this.slotFiller = new SlotFiller();
    this.healthMetrics = {
      successCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      requestCount: 0,
    };

    this.initializeLogicalRules();
    this.initializeConsequenceTemplates();

    logger.info('Logical generator initialized', {
      rulesCount: this.logicalRules.length,
      consequenceTemplatesCount: this.consequenceTemplates.length,
    });
  }

  /**
   * Generate prompts using logical rules and templates
   */
  async generatePrompts(parameters: SimulatorParameters, count: number): Promise<GeneratedPrompt[]> {
    const startTime = Date.now();
    
    try {
      this.healthMetrics.requestCount++;
      
      const prompts: GeneratedPrompt[] = [];
      const availableRules = this.filterRulesByParameters(parameters);

      if (availableRules.length === 0) {
        logger.warn('No applicable logical rules found', { parameters });
        return [];
      }

      // Generate prompts using different rule categories
      const ruleCategories = this.groupRulesByCategory(availableRules);
      
      for (let i = 0; i < count; i++) {
        // Select rule category with weighted randomness
        const category = this.selectRuleCategory(ruleCategories);
        const rule = this.selectRandomRule(ruleCategories[category]);
        
        if (rule) {
          const prompt = await this.generatePromptFromRule(rule, parameters);
          if (prompt) {
            prompts.push(prompt);
          }
        }
      }

      this.healthMetrics.successCount++;
      const responseTime = Date.now() - startTime;
      this.healthMetrics.totalResponseTime += responseTime;

      logger.debug('Logical prompts generated', {
        count: prompts.length,
        requestedCount: count,
        responseTime,
      });

      return prompts;
    } catch (error) {
      this.healthMetrics.errorCount++;
      logger.error('Logical prompt generation failed', { error, parameters, count });
      throw error;
    }
  }

  /**
   * Generate branch suggestions using logical rules
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
      
      // Extract entities and actions from node content
      const extractedData = this.extractEntitiesAndActions(nodeContent);
      
      // Generate branches using different techniques
      const techniques = [
        'character_reaction',
        'consequence_exploration',
        'conflict_escalation',
        'information_revelation',
        'choice_point',
      ];

      for (let i = 0; i < count; i++) {
        const technique = techniques[i % techniques.length];
        const branch = await this.generateBranchFromTechnique(
          technique,
          nodeContent,
          extractedData,
          parameters
        );
        
        if (branch) {
          branches.push(branch);
        }
      }

      this.healthMetrics.successCount++;
      const responseTime = Date.now() - startTime;
      this.healthMetrics.totalResponseTime += responseTime;

      logger.debug('Logical branches generated', {
        count: branches.length,
        requestedCount: count,
        responseTime,
      });

      return branches;
    } catch (error) {
      this.healthMetrics.errorCount++;
      logger.error('Logical branch generation failed', { error, nodeContent: nodeContent.substring(0, 100) });
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
    } else if (successRate < 80 || averageResponseTime > 2000) {
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
   * Initialize logical rules
   */
  private initializeLogicalRules(): void {
    this.logicalRules = [
      // Slot Permutation Rules
      {
        id: 'slot_perm_agent',
        name: 'Agent Permutation',
        category: 'slot_permutation',
        template: 'What if {alternative_agent} {event} instead of {original_agent}?',
        parameters: ['alternative_agent', 'event', 'original_agent'],
        weight: 0.8,
      },
      {
        id: 'slot_perm_setting',
        name: 'Setting Permutation',
        category: 'slot_permutation',
        template: 'What if {event} happened in {alternative_setting} instead of {original_setting}?',
        parameters: ['event', 'alternative_setting', 'original_setting'],
        weight: 0.7,
      },
      
      // Constraint Inversion Rules
      {
        id: 'constraint_public_private',
        name: 'Public/Private Inversion',
        category: 'constraint_inversion',
        template: 'What if {event} happened {privacy_inversion} instead?',
        parameters: ['event', 'privacy_inversion'],
        weight: 0.6,
      },
      {
        id: 'constraint_allowed_forbidden',
        name: 'Permission Inversion',
        category: 'constraint_inversion',
        template: 'What if {action} was {permission_inversion} when {event}?',
        parameters: ['action', 'permission_inversion', 'event'],
        weight: 0.6,
      },

      // Causal Branch Rules
      {
        id: 'causal_scientific',
        name: 'Scientific Consequence',
        category: 'causal_branch',
        template: 'What if {event} caused {scientific_consequence}?',
        parameters: ['event', 'scientific_consequence'],
        constraints: { genres: ['sci-fi', 'thriller', 'mystery'] },
        weight: 0.7,
      },
      {
        id: 'causal_social',
        name: 'Social Consequence',
        category: 'causal_branch',
        template: 'What if {event} led to {social_consequence}?',
        parameters: ['event', 'social_consequence'],
        weight: 0.8,
      },

      // Role Reversal Rules
      {
        id: 'role_protagonist_antagonist',
        name: 'Protagonist/Antagonist Reversal',
        category: 'role_reversal',
        template: 'What if {character} became the {opposite_role} in this situation?',
        parameters: ['character', 'opposite_role'],
        weight: 0.9,
      },
      {
        id: 'role_leader_follower',
        name: 'Leadership Reversal',
        category: 'role_reversal',
        template: 'What if {character} had to {leadership_action} instead of {current_action}?',
        parameters: ['character', 'leadership_action', 'current_action'],
        weight: 0.7,
      },

      // Temporal Displacement Rules
      {
        id: 'temporal_earlier',
        name: 'Earlier Timing',
        category: 'temporal_displacement',
        template: 'What if {event} happened {earlier_timing}?',
        parameters: ['event', 'earlier_timing'],
        weight: 0.6,
      },
      {
        id: 'temporal_era_shift',
        name: 'Era Transposition',
        category: 'temporal_displacement',
        template: 'What if {event} occurred in {different_era}?',
        parameters: ['event', 'different_era'],
        constraints: { genres: ['historical', 'sci-fi', 'fantasy'] },
        weight: 0.8,
      },
    ];
  }

  /**
   * Initialize consequence templates
   */
  private initializeConsequenceTemplates(): void {
    this.consequenceTemplates = [
      {
        id: 'sci_discovery',
        category: 'scientific',
        template: 'a breakthrough discovery that changes everything',
        parameters: [],
        impact_range: [0.7, 0.9],
      },
      {
        id: 'sci_technology',
        category: 'scientific',
        template: 'new technology that {tech_effect}',
        parameters: ['tech_effect'],
        impact_range: [0.6, 0.8],
      },
      {
        id: 'social_movement',
        category: 'social',
        template: 'a social movement that {movement_effect}',
        parameters: ['movement_effect'],
        impact_range: [0.5, 0.8],
      },
      {
        id: 'social_relationship',
        category: 'social',
        template: 'changed relationships between {group1} and {group2}',
        parameters: ['group1', 'group2'],
        impact_range: [0.4, 0.7],
      },
      {
        id: 'personal_growth',
        category: 'personal',
        template: '{character} discovering {personal_trait} about themselves',
        parameters: ['character', 'personal_trait'],
        impact_range: [0.6, 0.9],
      },
      {
        id: 'personal_trauma',
        category: 'personal',
        template: '{character} being forever changed by {traumatic_event}',
        parameters: ['character', 'traumatic_event'],
        impact_range: [0.7, 0.9],
      },
    ];
  }

  /**
   * Filter rules based on story parameters
   */
  private filterRulesByParameters(parameters: SimulatorParameters): LogicalRule[] {
    return this.logicalRules.filter(rule => {
      // Check genre constraints
      if (rule.constraints?.genres && parameters.genre) {
        if (!rule.constraints.genres.includes(parameters.genre)) {
          return false;
        }
      }

      // Check required fields
      if (rule.constraints?.required_fields) {
        for (const field of rule.constraints.required_fields) {
          if (!parameters[field as keyof SimulatorParameters]) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Group rules by category
   */
  private groupRulesByCategory(rules: LogicalRule[]): Record<string, LogicalRule[]> {
    return rules.reduce((groups, rule) => {
      if (!groups[rule.category]) {
        groups[rule.category] = [];
      }
      groups[rule.category].push(rule);
      return groups;
    }, {} as Record<string, LogicalRule[]>);
  }

  /**
   * Select rule category with weighted randomness
   */
  private selectRuleCategory(ruleCategories: Record<string, LogicalRule[]>): string {
    const categories = Object.keys(ruleCategories);
    if (categories.length === 0) return '';
    
    // Simple random selection for now
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Select random rule from category
   */
  private selectRandomRule(rules: LogicalRule[]): LogicalRule | null {
    if (rules.length === 0) return null;
    
    // Weight-based selection
    const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const rule of rules) {
      random -= rule.weight;
      if (random <= 0) {
        return rule;
      }
    }
    
    return rules[0]; // Fallback
  }

  /**
   * Generate prompt from a specific rule
   */
  private async generatePromptFromRule(
    rule: LogicalRule,
    parameters: SimulatorParameters
  ): Promise<GeneratedPrompt | null> {
    try {
      // Fill template slots based on rule type
      const filledTemplate = await this.slotFiller.fillSlots(rule.template, parameters, rule.category);
      
      if (!filledTemplate) {
        return null;
      }

      return {
        id: uuidv4(),
        prompt_text: filledTemplate,
        type: 'logical',
        tags: [rule.category, parameters.genre || 'general'].filter(Boolean),
        impact: this.calculateImpactScore(rule, parameters),
        confidence_score: 0.8, // High confidence for rule-based generation
        template_used: rule.id,
        generation_method: 'rule-based',
        explainability: {
          rule_applied: rule.name,
          template_id: rule.id,
          reasoning: `Applied ${rule.name} transformation to input parameters`,
        },
      };
    } catch (error) {
      logger.error('Failed to generate prompt from rule', { error, ruleId: rule.id });
      return null;
    }
  }

  /**
   * Extract entities and actions from node content
   */
  private extractEntitiesAndActions(content: string): {
    entities: string[];
    actions: string[];
    characters: string[];
    locations: string[];
  } {
    // Simple extraction logic - in a real implementation, you'd use NLP libraries
    const words = content.toLowerCase().split(/\s+/);
    
    // Simple heuristics for entity extraction
    const actionWords = words.filter(word => 
      ['go', 'run', 'walk', 'fight', 'speak', 'think', 'decide', 'choose', 'discover', 'find'].includes(word)
    );
    
    const entities = words.filter(word => 
      word.length > 3 && !['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had'].includes(word)
    ).slice(0, 10);

    return {
      entities,
      actions: actionWords,
      characters: [], // Would extract named entities
      locations: [], // Would extract location entities
    };
  }

  /**
   * Generate branch from specific technique
   */
  private async generateBranchFromTechnique(
    technique: string,
    nodeContent: string,
    extractedData: any,
    parameters: SimulatorParameters
  ): Promise<BranchSuggestion | null> {
    try {
      const branchTemplates = {
        character_reaction: 'React {emotion} to {situation}',
        consequence_exploration: 'Explore the {consequence_type} of {action}',
        conflict_escalation: 'Escalate the conflict by {escalation_method}',
        information_revelation: 'Reveal that {revelation}',
        choice_point: 'Choose between {option1} and {option2}',
      };

      const template = branchTemplates[technique as keyof typeof branchTemplates];
      if (!template) return null;

      // Fill template with extracted data and parameters
      const filledTemplate = await this.slotFiller.fillBranchSlots(
        template,
        extractedData,
        parameters,
        technique
      );

      if (!filledTemplate) return null;

      return {
        id: uuidv4(),
        branch_text: filledTemplate,
        branch_type: this.mapTechniqueToBranchType(technique),
        impact_score: Math.random() * 0.4 + 0.6, // 0.6-1.0 range
        estimated_outcome_summary: `Following this path would lead to ${technique.replace('_', ' ')} scenarios`,
        generation_method: 'rule-based',
        explainability: {
          rule_applied: technique,
          entities_used: extractedData.entities.slice(0, 3),
          reasoning: `Used ${technique} technique with extracted story elements`,
        },
      };
    } catch (error) {
      logger.error('Failed to generate branch from technique', { error, technique });
      return null;
    }
  }

  /**
   * Map technique to branch type
   */
  private mapTechniqueToBranchType(technique: string): BranchSuggestion['branch_type'] {
    const mapping: Record<string, BranchSuggestion['branch_type']> = {
      character_reaction: 'character-driven',
      consequence_exploration: 'procedural',
      conflict_escalation: 'escalation',
      information_revelation: 'plot-twist',
      choice_point: 'moral-dilemma',
    };

    return mapping[technique] || 'character-driven';
  }

  /**
   * Calculate impact score for a prompt
   */
  private calculateImpactScore(rule: LogicalRule, parameters: SimulatorParameters): number {
    let baseScore = rule.weight;
    
    // Adjust based on parameter completeness
    const parameterCount = Object.keys(parameters).filter(key => 
      parameters[key as keyof SimulatorParameters] !== undefined
    ).length;
    
    const completenessBonus = Math.min(parameterCount * 0.05, 0.2);
    
    return Math.min(baseScore + completenessBonus, 1.0);
  }
}
