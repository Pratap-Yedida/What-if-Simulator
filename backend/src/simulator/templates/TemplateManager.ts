import { logger } from '@/utils/logger';

export interface Template {
  id: string;
  name: string;
  category: string;
  template_text: string;
  parameters: Record<string, any>;
  constraints: {
    genres?: string[];
    tones?: string[];
    audience_age?: string[];
    required_fields?: string[];
  };
  usage_count: number;
  effectiveness_score: number;
  is_active: boolean;
  created_at: Date;
}

export interface TemplateFilter {
  category?: string;
  genre?: string;
  tone?: string;
  audience_age?: string;
  min_effectiveness?: number;
  is_active?: boolean;
}

export class TemplateManager {
  private templates: Map<string, Template>;
  private templatesByCategory: Map<string, Template[]>;

  constructor() {
    this.templates = new Map();
    this.templatesByCategory = new Map();
    
    this.initializeDefaultTemplates();
    logger.info('Template manager initialized', { 
      templateCount: this.templates.size,
      categories: this.templatesByCategory.size 
    });
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Template | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Template[] {
    return this.templatesByCategory.get(category) || [];
  }

  /**
   * Find templates matching filter criteria
   */
  findTemplates(filter: TemplateFilter = {}): Template[] {
    let results = Array.from(this.templates.values());

    // Apply filters
    if (filter.category) {
      results = results.filter(template => template.category === filter.category);
    }

    if (filter.genre) {
      results = results.filter(template => 
        !template.constraints.genres || template.constraints.genres.includes(filter.genre!)
      );
    }

    if (filter.tone) {
      results = results.filter(template =>
        !template.constraints.tones || template.constraints.tones.includes(filter.tone!)
      );
    }

    if (filter.audience_age) {
      results = results.filter(template =>
        !template.constraints.audience_age || template.constraints.audience_age.includes(filter.audience_age!)
      );
    }

    if (filter.min_effectiveness !== undefined) {
      results = results.filter(template => template.effectiveness_score >= filter.min_effectiveness!);
    }

    if (filter.is_active !== undefined) {
      results = results.filter(template => template.is_active === filter.is_active);
    }

    // Sort by effectiveness score (descending)
    results.sort((a, b) => b.effectiveness_score - a.effectiveness_score);

    return results;
  }

  /**
   * Add a new template
   */
  addTemplate(templateData: Omit<Template, 'id' | 'usage_count' | 'created_at'>): Template {
    const template: Template = {
      ...templateData,
      id: this.generateTemplateId(),
      usage_count: 0,
      created_at: new Date(),
    };

    this.templates.set(template.id, template);
    this.addToCategory(template);

    logger.info('Template added', { 
      templateId: template.id, 
      category: template.category 
    });

    return template;
  }

  /**
   * Update template effectiveness based on usage feedback
   */
  updateEffectiveness(templateId: string, feedback: {
    was_accepted: boolean;
    was_edited: boolean;
    user_rating?: number;
  }): boolean {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }

    // Update usage count
    template.usage_count++;

    // Calculate new effectiveness score
    let scoreAdjustment = 0;
    
    if (feedback.was_accepted) {
      scoreAdjustment += 0.1;
    } else {
      scoreAdjustment -= 0.05;
    }

    if (feedback.was_edited) {
      scoreAdjustment -= 0.02; // Small penalty for needing edits
    }

    if (feedback.user_rating !== undefined) {
      // User rating from 1-5, normalize to -0.1 to +0.1
      scoreAdjustment += (feedback.user_rating - 3) * 0.03;
    }

    // Apply learning rate decay based on usage count
    const learningRate = Math.max(0.01, 1 / Math.sqrt(template.usage_count));
    template.effectiveness_score = Math.max(0, Math.min(1, 
      template.effectiveness_score + scoreAdjustment * learningRate
    ));

    logger.debug('Template effectiveness updated', {
      templateId,
      oldEffectiveness: template.effectiveness_score - scoreAdjustment * learningRate,
      newEffectiveness: template.effectiveness_score,
      feedback,
    });

    return true;
  }

  /**
   * Get template statistics
   */
  getStats(): {
    totalTemplates: number;
    activeTemplates: number;
    categoryCounts: Record<string, number>;
    averageEffectiveness: number;
    topTemplates: Array<{ id: string; name: string; effectiveness: number; usage: number }>;
  } {
    const templates = Array.from(this.templates.values());
    const activeTemplates = templates.filter(t => t.is_active);
    
    const categoryCounts: Record<string, number> = {};
    templates.forEach(template => {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    });

    const averageEffectiveness = templates.length > 0
      ? templates.reduce((sum, t) => sum + t.effectiveness_score, 0) / templates.length
      : 0;

    const topTemplates = templates
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        name: t.name,
        effectiveness: t.effectiveness_score,
        usage: t.usage_count,
      }));

    return {
      totalTemplates: templates.length,
      activeTemplates: activeTemplates.length,
      categoryCounts,
      averageEffectiveness,
      topTemplates,
    };
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<Template, 'id' | 'usage_count' | 'created_at'>[] = [
      // Logical Templates
      {
        name: 'Character Trait Reversal',
        category: 'logical',
        template_text: 'What if {character} acted completely opposite to their {trait} nature when {event}?',
        parameters: {
          required: ['character', 'trait', 'event'],
          optional: []
        },
        constraints: {
          required_fields: ['character', 'event']
        },
        effectiveness_score: 0.85,
        is_active: true,
      },
      
      {
        name: 'Setting Inversion',
        category: 'logical',
        template_text: 'What if the {event} happened in a {opposite_setting} instead of {original_setting}?',
        parameters: {
          required: ['event', 'opposite_setting', 'original_setting'],
          optional: []
        },
        constraints: {},
        effectiveness_score: 0.78,
        is_active: true,
      },

      {
        name: 'Consequence Escalation',
        category: 'logical',
        template_text: 'What if the {event} caused {unexpected_consequence} that changed everything?',
        parameters: {
          required: ['event', 'unexpected_consequence'],
          optional: ['scope']
        },
        constraints: {
          genres: ['sci-fi', 'fantasy', 'mystery', 'thriller']
        },
        effectiveness_score: 0.82,
        is_active: true,
      },

      {
        name: 'Role Reversal',
        category: 'logical',
        template_text: 'What if {character} had to become the {opposite_role} to succeed?',
        parameters: {
          required: ['character', 'opposite_role'],
          optional: ['motivation']
        },
        constraints: {},
        effectiveness_score: 0.90,
        is_active: true,
      },

      {
        name: 'Temporal Displacement',
        category: 'logical',
        template_text: 'What if {event} occurred {time_shift} instead?',
        parameters: {
          required: ['event', 'time_shift'],
          optional: ['consequences']
        },
        constraints: {
          genres: ['historical', 'sci-fi', 'fantasy']
        },
        effectiveness_score: 0.75,
        is_active: true,
      },

      // Creative Templates
      {
        name: 'Concept Blending',
        category: 'creative',
        template_text: 'What if {concept1} and {concept2} merged in ways that {unexpected_result}?',
        parameters: {
          required: ['concept1', 'concept2', 'unexpected_result'],
          optional: ['implications']
        },
        constraints: {},
        effectiveness_score: 0.73,
        is_active: true,
      },

      {
        name: 'Genre Violation',
        category: 'creative',
        template_text: 'What if this {genre} story suddenly became about {different_genre_element}?',
        parameters: {
          required: ['genre', 'different_genre_element'],
          optional: ['transition_method']
        },
        constraints: {},
        effectiveness_score: 0.88,
        is_active: true,
      },

      {
        name: 'Reality Question',
        category: 'creative',
        template_text: 'What if everything the characters believed about {fundamental_assumption} was wrong?',
        parameters: {
          required: ['fundamental_assumption'],
          optional: ['truth', 'implications']
        },
        constraints: {},
        effectiveness_score: 0.92,
        is_active: true,
      },

      {
        name: 'Perspective Paradox',
        category: 'creative',
        template_text: 'What if the story was actually being told by {unexpected_narrator} all along?',
        parameters: {
          required: ['unexpected_narrator'],
          optional: ['reason', 'revelation_method']
        },
        constraints: {},
        effectiveness_score: 0.80,
        is_active: true,
      },

      // Character-driven Templates
      {
        name: 'Internal Conflict',
        category: 'character-driven',
        template_text: 'What if {character} discovered that their {core_belief} conflicted with {new_information}?',
        parameters: {
          required: ['character', 'core_belief', 'new_information'],
          optional: ['internal_struggle']
        },
        constraints: {},
        effectiveness_score: 0.87,
        is_active: true,
      },

      {
        name: 'Moral Dilemma',
        category: 'character-driven',
        template_text: 'What if {character} had to choose between {value1} and {value2}?',
        parameters: {
          required: ['character', 'value1', 'value2'],
          optional: ['stakes', 'consequences']
        },
        constraints: {},
        effectiveness_score: 0.91,
        is_active: true,
      },

      {
        name: 'Hidden Connection',
        category: 'character-driven',
        template_text: 'What if {character1} discovered they were {relationship} to {character2}?',
        parameters: {
          required: ['character1', 'character2', 'relationship'],
          optional: ['how_revealed', 'implications']
        },
        constraints: {},
        effectiveness_score: 0.84,
        is_active: true,
      },

      // Thematic Templates
      {
        name: 'Theme Inversion',
        category: 'thematic',
        template_text: 'What if the story\'s message about {theme} was completely reversed?',
        parameters: {
          required: ['theme'],
          optional: ['new_message', 'how_shown']
        },
        constraints: {},
        effectiveness_score: 0.76,
        is_active: true,
      },

      {
        name: 'Symbolic Literalization',
        category: 'thematic',
        template_text: 'What if the metaphor of {metaphor} became literally true in the story?',
        parameters: {
          required: ['metaphor'],
          optional: ['literal_manifestation', 'consequences']
        },
        constraints: {
          genres: ['fantasy', 'sci-fi', 'magical-realism']
        },
        effectiveness_score: 0.79,
        is_active: true,
      },

      // Branch-specific Templates
      {
        name: 'Investigation Branch',
        category: 'procedural',
        template_text: 'Investigate the {mystery_element} to uncover {potential_discovery}',
        parameters: {
          required: ['mystery_element', 'potential_discovery'],
          optional: ['investigation_method', 'obstacles']
        },
        constraints: {
          genres: ['mystery', 'thriller', 'detective']
        },
        effectiveness_score: 0.83,
        is_active: true,
      },

      {
        name: 'Confrontation Branch',
        category: 'escalation',
        template_text: 'Confront {target} about {issue} and risk {potential_consequence}',
        parameters: {
          required: ['target', 'issue', 'potential_consequence'],
          optional: ['approach', 'backup_plan']
        },
        constraints: {},
        effectiveness_score: 0.81,
        is_active: true,
      },

      {
        name: 'Alliance Branch',
        category: 'de-escalation',
        template_text: 'Form an unlikely alliance with {potential_ally} to {common_goal}',
        parameters: {
          required: ['potential_ally', 'common_goal'],
          optional: ['terms', 'risks']
        },
        constraints: {},
        effectiveness_score: 0.77,
        is_active: true,
      },
    ];

    // Add all default templates
    defaultTemplates.forEach(templateData => {
      this.addTemplate(templateData);
    });

    logger.info('Default templates initialized', { count: defaultTemplates.length });
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add template to category index
   */
  private addToCategory(template: Template): void {
    if (!this.templatesByCategory.has(template.category)) {
      this.templatesByCategory.set(template.category, []);
    }
    
    const categoryTemplates = this.templatesByCategory.get(template.category)!;
    categoryTemplates.push(template);
    
    // Keep category templates sorted by effectiveness
    categoryTemplates.sort((a, b) => b.effectiveness_score - a.effectiveness_score);
  }

  /**
   * Remove template from category index
   */
  private removeFromCategory(template: Template): void {
    const categoryTemplates = this.templatesByCategory.get(template.category);
    if (categoryTemplates) {
      const index = categoryTemplates.findIndex(t => t.id === template.id);
      if (index >= 0) {
        categoryTemplates.splice(index, 1);
      }
    }
  }

  /**
   * Deactivate underperforming templates
   */
  pruneIneffectiveTemplates(minEffectiveness: number = 0.3, minUsage: number = 10): number {
    let deactivatedCount = 0;
    
    for (const template of this.templates.values()) {
      if (template.is_active && 
          template.usage_count >= minUsage && 
          template.effectiveness_score < minEffectiveness) {
        
        template.is_active = false;
        deactivatedCount++;
        
        logger.info('Template deactivated due to poor performance', {
          templateId: template.id,
          effectiveness: template.effectiveness_score,
          usage: template.usage_count,
        });
      }
    }

    return deactivatedCount;
  }

  /**
   * Get template recommendations based on current performance
   */
  getRecommendations(): {
    topPerforming: Template[];
    needsImprovement: Template[];
    underutilized: Template[];
  } {
    const templates = Array.from(this.templates.values()).filter(t => t.is_active);
    
    const topPerforming = templates
      .filter(t => t.effectiveness_score >= 0.8 && t.usage_count >= 5)
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
      .slice(0, 5);

    const needsImprovement = templates
      .filter(t => t.effectiveness_score < 0.6 && t.usage_count >= 3)
      .sort((a, b) => a.effectiveness_score - b.effectiveness_score)
      .slice(0, 5);

    const underutilized = templates
      .filter(t => t.usage_count < 3 && t.effectiveness_score >= 0.7)
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
      .slice(0, 5);

    return {
      topPerforming,
      needsImprovement,
      underutilized,
    };
  }
}
