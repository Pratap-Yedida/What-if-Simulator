import { logger } from '@/utils/logger';
import type { SimulatorParameters } from '../core/SimulatorEngine';

export interface SlotFillerRule {
  slotName: string;
  category: string;
  fillerFunction: (params: SimulatorParameters, context?: any) => string[];
  priority: number;
}

export interface FilledSlot {
  slotName: string;
  originalValue: string;
  filledValue: string;
  confidence: number;
}

export class SlotFiller {
  private fillerRules: Map<string, SlotFillerRule[]>;
  private oppositeValues: Map<string, string[]>;
  private alternativeValues: Map<string, string[]>;
  private consequenceCategories: Map<string, string[]>;

  constructor() {
    this.fillerRules = new Map();
    this.oppositeValues = new Map();
    this.alternativeValues = new Map();
    this.consequenceCategories = new Map();

    this.initializeFillerRules();
    this.initializeValueMappings();

    logger.info('Slot filler initialized', {
      rulesCount: Array.from(this.fillerRules.values()).reduce((sum, rules) => sum + rules.length, 0),
      oppositeValuesCount: this.oppositeValues.size,
    });
  }

  /**
   * Fill template slots with appropriate values
   */
  async fillSlots(
    template: string,
    parameters: SimulatorParameters,
    ruleCategory?: string
  ): Promise<string | null> {
    try {
      const slots = this.extractSlots(template);
      if (slots.length === 0) {
        return template; // No slots to fill
      }

      let filledTemplate = template;
      const filledSlots: FilledSlot[] = [];

      for (const slot of slots) {
        const filledValue = await this.fillSingleSlot(slot, parameters, ruleCategory);
        if (filledValue) {
          filledTemplate = filledTemplate.replace(`{${slot}}`, filledValue.filledValue);
          filledSlots.push(filledValue);
        } else {
          // If we can't fill a required slot, return null
          logger.warn('Failed to fill required slot', { slot, template });
          return null;
        }
      }

      logger.debug('Template slots filled', {
        originalTemplate: template,
        filledTemplate,
        slotsCount: slots.length,
      });

      return filledTemplate;
    } catch (error) {
      logger.error('Template slot filling failed', { error, template });
      return null;
    }
  }

  /**
   * Fill branch-specific slots
   */
  async fillBranchSlots(
    template: string,
    extractedData: any,
    parameters: SimulatorParameters,
    technique: string
  ): Promise<string | null> {
    try {
      const slots = this.extractSlots(template);
      let filledTemplate = template;

      for (const slot of slots) {
        const filledValue = await this.fillBranchSlot(slot, extractedData, parameters, technique);
        if (filledValue) {
          filledTemplate = filledTemplate.replace(`{${slot}}`, filledValue);
        } else {
          // Provide fallback values for branch templates
          const fallback = this.getFallbackValue(slot, parameters);
          filledTemplate = filledTemplate.replace(`{${slot}}`, fallback);
        }
      }

      return filledTemplate;
    } catch (error) {
      logger.error('Branch slot filling failed', { error, template, technique });
      return null;
    }
  }

  /**
   * Extract slot names from template
   */
  private extractSlots(template: string): string[] {
    const slotRegex = /\{([^}]+)\}/g;
    const slots: string[] = [];
    let match;

    while ((match = slotRegex.exec(template)) !== null) {
      slots.push(match[1]);
    }

    return [...new Set(slots)]; // Remove duplicates
  }

  /**
   * Fill a single slot with appropriate value
   */
  private async fillSingleSlot(
    slotName: string,
    parameters: SimulatorParameters,
    ruleCategory?: string
  ): Promise<FilledSlot | null> {
    const rules = this.fillerRules.get(slotName) || [];
    
    // Sort rules by priority and try each one
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      // Skip if rule doesn't match the category
      if (ruleCategory && rule.category !== 'general' && rule.category !== ruleCategory) {
        continue;
      }

      try {
        const values = rule.fillerFunction(parameters);
        if (values && values.length > 0) {
          const selectedValue = this.selectRandomValue(values);
          return {
            slotName,
            originalValue: `{${slotName}}`,
            filledValue: selectedValue,
            confidence: this.calculateConfidence(rule, parameters),
          };
        }
      } catch (error) {
        logger.debug('Filler rule failed', { error, slotName, rule: rule.category });
        continue;
      }
    }

    // If no rules worked, try generic filling
    return this.genericSlotFill(slotName, parameters);
  }

  /**
   * Fill branch-specific slot
   */
  private async fillBranchSlot(
    slotName: string,
    extractedData: any,
    parameters: SimulatorParameters,
    technique: string
  ): Promise<string | null> {
    // Map slot names to extraction data or parameters
    const slotMappings: Record<string, () => string | null> = {
      emotion: () => this.selectRandomValue(['anger', 'fear', 'joy', 'sadness', 'surprise', 'determination']),
      situation: () => extractedData.entities[0] || 'the current situation',
      consequence_type: () => this.selectRandomValue(['consequences', 'implications', 'effects', 'outcomes']),
      action: () => extractedData.actions[0] || 'the recent action',
      escalation_method: () => this.selectRandomValue(['confrontation', 'raising the stakes', 'involving others', 'taking risks']),
      revelation: () => this.selectRandomValue(['a hidden truth', 'a secret connection', 'a surprising fact', 'an unexpected motive']),
      option1: () => this.selectRandomValue(['safety', 'truth', 'loyalty', 'duty']),
      option2: () => this.selectRandomValue(['freedom', 'happiness', 'success', 'revenge']),
    };

    const mapper = slotMappings[slotName];
    return mapper ? mapper() : null;
  }

  /**
   * Get fallback value for a slot
   */
  private getFallbackValue(slotName: string, parameters: SimulatorParameters): string {
    const fallbacks: Record<string, string> = {
      character: parameters.character?.name || 'the protagonist',
      event: parameters.event || 'something important',
      setting: parameters.setting?.place || 'this place',
      emotion: 'conflicted',
      situation: 'the current situation',
      action: 'taking action',
      choice: 'making a decision',
      consequence: 'unexpected results',
      revelation: 'a surprising discovery',
      option1: 'one path',
      option2: 'another path',
    };

    return fallbacks[slotName] || 'something significant';
  }

  /**
   * Initialize filler rules for different slot types
   */
  private initializeFillerRules(): void {
    // Character-related slots
    this.addFillerRule('character', 'general', (params) => {
      const values = [];
      if (params.character?.name) values.push(params.character.name);
      values.push('the protagonist', 'the main character', 'our hero');
      return values;
    }, 10);

    this.addFillerRule('alternative_agent', 'slot_permutation', (params) => {
      const alternatives = ['a stranger', 'an enemy', 'a friend', 'a mentor', 'a rival'];
      if (params.character?.name) {
        alternatives.push(`someone like ${params.character.name}`, `the opposite of ${params.character.name}`);
      }
      return alternatives;
    }, 8);

    // Event-related slots
    this.addFillerRule('event', 'general', (params) => {
      const values = [];
      if (params.event) values.push(params.event);
      values.push('something unexpected happened', 'the situation changed', 'a crisis occurred');
      return values;
    }, 10);

    // Setting-related slots
    this.addFillerRule('original_setting', 'slot_permutation', (params) => {
      const values = [];
      if (params.setting?.place) values.push(params.setting.place);
      values.push('here', 'this place', 'the current location');
      return values;
    }, 9);

    this.addFillerRule('alternative_setting', 'slot_permutation', (params) => {
      const alternatives = ['a different world', 'the past', 'the future', 'a parallel dimension'];
      if (params.setting?.place) {
        const opposites = this.oppositeValues.get(params.setting.place) || ['somewhere completely different'];
        alternatives.push(...opposites);
      }
      return alternatives;
    }, 8);

    // Trait-related slots
    this.addFillerRule('trait', 'character_conflict', (params) => {
      if (params.character?.traits && params.character.traits.length > 0) {
        return [...params.character.traits];
      }
      return ['brave', 'cautious', 'curious', 'stubborn', 'kind'];
    }, 10);

    this.addFillerRule('opposite_role', 'role_reversal', (params) => {
      return ['villain', 'victim', 'hero', 'mentor', 'trickster', 'guardian', 'rebel'];
    }, 7);

    // Consequence-related slots
    this.addFillerRule('unexpected_consequence', 'causal_branch', (params) => {
      const consequences = this.consequenceCategories.get('general') || [];
      if (params.genre) {
        const genreConsequences = this.consequenceCategories.get(params.genre) || [];
        consequences.push(...genreConsequences);
      }
      return consequences;
    }, 8);

    this.addFillerRule('scientific_consequence', 'causal_branch', (params) => {
      return this.consequenceCategories.get('scientific') || ['a breakthrough discovery', 'new technology emerged', 'the laws of physics changed'];
    }, 9);

    this.addFillerRule('social_consequence', 'causal_branch', (params) => {
      return this.consequenceCategories.get('social') || ['society transformed', 'relationships changed', 'communities formed'];
    }, 9);

    // Time-related slots
    this.addFillerRule('time_shift', 'temporal_displacement', (params) => {
      return ['much earlier', 'much later', 'in a different era', 'at the wrong time', 'when least expected'];
    }, 7);

    this.addFillerRule('different_era', 'temporal_displacement', (params) => {
      return ['the distant past', 'the far future', 'ancient times', 'a parallel timeline', 'another century'];
    }, 8);

    // Creative slots
    this.addFillerRule('concept1', 'concept_blending', (params) => {
      return ['time', 'memory', 'dreams', 'fear', 'technology', 'nature', 'power', 'truth'];
    }, 6);

    this.addFillerRule('concept2', 'concept_blending', (params) => {
      return ['love', 'betrayal', 'justice', 'chaos', 'freedom', 'knowledge', 'mystery', 'hope'];
    }, 6);

    this.addFillerRule('fundamental_assumption', 'creative', (params) => {
      return ['reality', 'time', 'identity', 'morality', 'the nature of existence', 'what they thought they knew'];
    }, 7);

    // Privacy and permission slots
    this.addFillerRule('privacy_inversion', 'constraint_inversion', (params) => {
      return ['in public', 'in private', 'secretly', 'openly', 'for everyone to see', 'in complete isolation'];
    }, 7);

    this.addFillerRule('permission_inversion', 'constraint_inversion', (params) => {
      return ['forbidden', 'required', 'ignored', 'celebrated', 'punished', 'rewarded'];
    }, 7);

    // Value and belief slots
    this.addFillerRule('value1', 'character_driven', (params) => {
      return ['loyalty', 'truth', 'freedom', 'safety', 'justice', 'love'];
    }, 8);

    this.addFillerRule('value2', 'character_driven', (params) => {
      return ['duty', 'success', 'happiness', 'power', 'knowledge', 'revenge'];
    }, 8);

    this.addFillerRule('core_belief', 'character_driven', (params) => {
      return ['everything happens for a reason', 'people are fundamentally good', 'hard work pays off', 'family comes first'];
    }, 8);

    this.addFillerRule('new_information', 'character_driven', (params) => {
      return ['a shocking revelation', 'evidence to the contrary', 'a different perspective', 'hidden history'];
    }, 8);
  }

  /**
   * Add a filler rule
   */
  private addFillerRule(
    slotName: string,
    category: string,
    fillerFunction: (params: SimulatorParameters, context?: any) => string[],
    priority: number
  ): void {
    if (!this.fillerRules.has(slotName)) {
      this.fillerRules.set(slotName, []);
    }

    this.fillerRules.get(slotName)!.push({
      slotName,
      category,
      fillerFunction,
      priority,
    });
  }

  /**
   * Initialize value mappings (opposites, alternatives, etc.)
   */
  private initializeValueMappings(): void {
    // Opposite values
    this.oppositeValues.set('brave', ['cowardly', 'fearful', 'timid']);
    this.oppositeValues.set('kind', ['cruel', 'harsh', 'callous']);
    this.oppositeValues.set('curious', ['indifferent', 'incurious', 'uninterested']);
    this.oppositeValues.set('public', ['private', 'secret', 'hidden']);
    this.oppositeValues.set('city', ['countryside', 'wilderness', 'rural area']);
    this.oppositeValues.set('past', ['future', 'present', 'tomorrow']);
    this.oppositeValues.set('light', ['darkness', 'shadow', 'night']);
    this.oppositeValues.set('order', ['chaos', 'disorder', 'anarchy']);

    // Alternative values
    this.alternativeValues.set('protagonist', ['hero', 'main character', 'central figure']);
    this.alternativeValues.set('villain', ['antagonist', 'enemy', 'adversary']);
    this.alternativeValues.set('mystery', ['puzzle', 'enigma', 'riddle']);

    // Consequence categories
    this.consequenceCategories.set('general', [
      'everything changed forever',
      'unexpected alliances formed',
      'hidden truths emerged',
      'the balance of power shifted',
      'new possibilities opened',
      'old certainties crumbled',
    ]);

    this.consequenceCategories.set('scientific', [
      'a breakthrough discovery',
      'new technology emerged',
      'the laws of physics changed',
      'evolution accelerated',
      'consciousness expanded',
      'reality became malleable',
    ]);

    this.consequenceCategories.set('social', [
      'society transformed',
      'relationships changed fundamentally',
      'communities formed or disbanded',
      'hierarchies collapsed',
      'new cultures emerged',
      'communication revolutionized',
    ]);

    this.consequenceCategories.set('personal', [
      'identity crisis occurred',
      'hidden potential awakened',
      'past traumas surfaced',
      'personal growth accelerated',
      'relationships deepened',
      'life purpose clarified',
    ]);

    this.consequenceCategories.set('mystery', [
      'new clues emerged',
      'suspects multiplied',
      'the truth became more elusive',
      'red herrings appeared',
      'the mystery deepened',
      'connections were revealed',
    ]);

    this.consequenceCategories.set('sci-fi', [
      'technology gained consciousness',
      'time paradoxes emerged',
      'alternate realities collided',
      'evolution took an unexpected turn',
      'the simulation glitched',
      'artificial life emerged',
    ]);

    this.consequenceCategories.set('fantasy', [
      'magic became unpredictable',
      'ancient powers awakened',
      'prophecies began fulfilling',
      'mythical creatures appeared',
      'the veil between worlds thinned',
      'forgotten spells activated',
    ]);
  }

  /**
   * Select random value from array with some intelligence
   */
  private selectRandomValue(values: string[]): string {
    if (values.length === 0) return 'something';
    if (values.length === 1) return values[0];
    
    // Add some randomness but prefer more interesting/specific options
    const weights = values.map((_, index) => {
      // Prefer later items (often more specific/interesting)
      return Math.pow(1.2, index);
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < values.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return values[i];
      }
    }
    
    return values[values.length - 1]; // Fallback
  }

  /**
   * Calculate confidence score for a filled slot
   */
  private calculateConfidence(rule: SlotFillerRule, parameters: SimulatorParameters): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for higher priority rules
    confidence += (rule.priority / 10) * 0.3;
    
    // Higher confidence when we have relevant parameters
    const relevantParams = Object.keys(parameters).filter(key => 
      parameters[key as keyof SimulatorParameters] !== undefined
    ).length;
    
    confidence += Math.min(relevantParams * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generic slot filling as fallback
   */
  private genericSlotFill(slotName: string, parameters: SimulatorParameters): FilledSlot | null {
    const genericMappings: Record<string, string[]> = {
      character: ['the protagonist', 'the main character'],
      event: ['something happened', 'an event occurred'],
      setting: ['somewhere', 'in this place'],
      trait: ['determined', 'conflicted'],
      emotion: ['uncertain', 'curious'],
      action: ['taking action', 'making a choice'],
      consequence: ['unexpected results', 'change'],
      time: ['at that moment', 'eventually'],
      reason: ['for unknown reasons', 'mysteriously'],
    };

    const values = genericMappings[slotName] || ['something significant'];
    const selectedValue = this.selectRandomValue(values);

    return {
      slotName,
      originalValue: `{${slotName}}`,
      filledValue: selectedValue,
      confidence: 0.3, // Low confidence for generic fills
    };
  }
}
