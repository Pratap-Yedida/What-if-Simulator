import { logger } from '@/utils/logger';

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  categories: ModerationCategory[];
  suggestions: string[];
  requiresReview: boolean;
  flags: ModerationFlag[];
}

export interface ModerationCategory {
  name: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModerationFlag {
  type: 'inappropriate' | 'violence' | 'hate_speech' | 'adult_content' | 'spam' | 'copyright';
  confidence: number;
  description: string;
  suggestion?: string;
}

export interface ContentFilters {
  enableViolenceFilter: boolean;
  enableAdultContentFilter: boolean;
  enableHateSpeechFilter: boolean;
  enableSpamFilter: boolean;
  enableCopyrightFilter: boolean;
  strictMode: boolean;
  customBlockedWords: string[];
  customBlockedPhrases: string[];
  allowedContentTypes: string[];
  ageRestriction: 'all' | 'teen' | 'mature';
}

export class ContentModerationService {
  private static instance: ContentModerationService;
  private filters: ContentFilters;

  private constructor() {
    this.filters = {
      enableViolenceFilter: true,
      enableAdultContentFilter: true,
      enableHateSpeechFilter: true,
      enableSpamFilter: true,
      enableCopyrightFilter: true,
      strictMode: false,
      customBlockedWords: [],
      customBlockedPhrases: [],
      allowedContentTypes: ['story', 'choice', 'description'],
      ageRestriction: 'all',
    };
  }

  public static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService();
    }
    return ContentModerationService.instance;
  }

  /**
   * Moderate text content
   */
  async moderateText(content: string, contentType: string = 'story'): Promise<ModerationResult> {
    try {
      logger.debug('Starting content moderation', { 
        contentLength: content.length, 
        contentType 
      });

      const result: ModerationResult = {
        isApproved: true,
        confidence: 1.0,
        categories: [],
        suggestions: [],
        requiresReview: false,
        flags: [],
      };

      // Check if content type is allowed
      if (!this.filters.allowedContentTypes.includes(contentType)) {
        result.isApproved = false;
        result.flags.push({
          type: 'inappropriate',
          confidence: 1.0,
          description: 'Content type not allowed',
          suggestion: 'Please use an allowed content type',
        });
        return result;
      }

      // Run various moderation checks
      await this.checkViolence(content, result);
      await this.checkAdultContent(content, result);
      await this.checkHateSpeech(content, result);
      await this.checkSpam(content, result);
      await this.checkCopyright(content, result);
      await this.checkCustomFilters(content, result);

      // Determine final approval status
      result.isApproved = this.determineApproval(result);
      result.confidence = this.calculateConfidence(result);
      result.requiresReview = this.requiresReview(result);

      logger.debug('Content moderation completed', {
        isApproved: result.isApproved,
        confidence: result.confidence,
        flagCount: result.flags.length,
        requiresReview: result.requiresReview,
      });

      return result;
    } catch (error) {
      logger.error('Content moderation failed', { error, content: content.substring(0, 100) });
      
      // Fail safe - approve content if moderation fails
      return {
        isApproved: true,
        confidence: 0.5,
        categories: [],
        suggestions: ['Content moderation failed - manual review recommended'],
        requiresReview: true,
        flags: [],
      };
    }
  }

  /**
   * Moderate story content (nodes and branches)
   */
  async moderateStory(storyData: {
    title: string;
    description?: string;
    nodes: Array<{ content: string; node_type: string }>;
    branches: Array<{ label: string; branch_type: string }>;
  }): Promise<ModerationResult> {
    try {
      const allContent = [
        storyData.title,
        storyData.description || '',
        ...storyData.nodes.map(n => n.content),
        ...storyData.branches.map(b => b.label),
      ].join(' ');

      const result = await this.moderateText(allContent, 'story');

      // Add story-specific checks
      await this.checkStoryStructure(storyData, result);

      return result;
    } catch (error) {
      logger.error('Story moderation failed', { error });
      return {
        isApproved: true,
        confidence: 0.5,
        categories: [],
        suggestions: ['Story moderation failed - manual review recommended'],
        requiresReview: true,
        flags: [],
      };
    }
  }

  /**
   * Moderate AI-generated prompts
   */
  async moderatePrompt(promptText: string, context?: any): Promise<ModerationResult> {
    try {
      const result = await this.moderateText(promptText, 'prompt');

      // Add prompt-specific checks
      await this.checkPromptQuality(promptText, result);
      await this.checkPromptSafety(promptText, context, result);

      return result;
    } catch (error) {
      logger.error('Prompt moderation failed', { error });
      return {
        isApproved: true,
        confidence: 0.5,
        categories: [],
        suggestions: ['Prompt moderation failed - manual review recommended'],
        requiresReview: true,
        flags: [],
      };
    }
  }

  /**
   * Update moderation filters
   */
  updateFilters(newFilters: Partial<ContentFilters>): void {
    this.filters = { ...this.filters, ...newFilters };
    logger.info('Content moderation filters updated', { filters: newFilters });
  }

  /**
   * Get current filters
   */
  getFilters(): ContentFilters {
    return { ...this.filters };
  }

  // Private moderation methods

  private async checkViolence(content: string, result: ModerationResult): Promise<void> {
    if (!this.filters.enableViolenceFilter) return;

    const violenceKeywords = [
      'kill', 'murder', 'death', 'violence', 'blood', 'gore', 'torture',
      'assault', 'attack', 'fight', 'war', 'battle', 'weapon', 'gun',
      'knife', 'bomb', 'explosion', 'destruction', 'harm', 'hurt'
    ];

    const violencePhrases = [
      'graphic violence', 'explicit violence', 'extreme violence',
      'violent death', 'brutal murder', 'torture scene'
    ];

    const foundKeywords = violenceKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    const foundPhrases = violencePhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );

    if (foundKeywords.length > 0 || foundPhrases.length > 0) {
      const confidence = Math.min(0.9, (foundKeywords.length * 0.1) + (foundPhrases.length * 0.3));
      
      result.categories.push({
        name: 'violence',
        confidence,
        severity: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
      });

      if (this.filters.strictMode || confidence > 0.7) {
        result.flags.push({
          type: 'violence',
          confidence,
          description: 'Content contains violent themes',
          suggestion: 'Consider reducing or removing violent content',
        });
      }
    }
  }

  private async checkAdultContent(content: string, result: ModerationResult): Promise<void> {
    if (!this.filters.enableAdultContentFilter) return;

    const adultKeywords = [
      'sex', 'sexual', 'nude', 'naked', 'porn', 'adult', 'explicit',
      'intimate', 'romance', 'love', 'kiss', 'touch', 'body'
    ];

    const adultPhrases = [
      'sexual content', 'adult themes', 'mature content', 'explicit scenes',
      'romantic scenes', 'intimate moments'
    ];

    const foundKeywords = adultKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    const foundPhrases = adultPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );

    if (foundKeywords.length > 0 || foundPhrases.length > 0) {
      const confidence = Math.min(0.9, (foundKeywords.length * 0.1) + (foundPhrases.length * 0.3));
      
      result.categories.push({
        name: 'adult_content',
        confidence,
        severity: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
      });

      if (this.filters.ageRestriction === 'all' && (this.filters.strictMode || confidence > 0.6)) {
        result.flags.push({
          type: 'adult_content',
          confidence,
          description: 'Content may contain adult themes',
          suggestion: 'Consider adding age restrictions or removing adult content',
        });
      }
    }
  }

  private async checkHateSpeech(content: string, result: ModerationResult): Promise<void> {
    if (!this.filters.enableHateSpeechFilter) return;

    const hateKeywords = [
      'hate', 'racist', 'sexist', 'homophobic', 'discrimination',
      'prejudice', 'bias', 'offensive', 'insult', 'derogatory'
    ];

    const hatePhrases = [
      'hate speech', 'discriminatory language', 'offensive content',
      'derogatory remarks', 'prejudiced views'
    ];

    const foundKeywords = hateKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    const foundPhrases = hatePhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );

    if (foundKeywords.length > 0 || foundPhrases.length > 0) {
      const confidence = Math.min(0.95, (foundKeywords.length * 0.2) + (foundPhrases.length * 0.4));
      
      result.categories.push({
        name: 'hate_speech',
        confidence,
        severity: 'critical',
      });

      result.flags.push({
        type: 'hate_speech',
        confidence,
        description: 'Content may contain hate speech or discriminatory language',
        suggestion: 'Please remove any hateful or discriminatory content',
      });
    }
  }

  private async checkSpam(content: string, result: ModerationResult): Promise<void> {
    if (!this.filters.enableSpamFilter) return;

    const spamIndicators = [
      'buy now', 'click here', 'free money', 'win big', 'limited time',
      'act now', 'don\'t miss', 'exclusive offer', 'guaranteed',
      'no risk', '100% free', 'instant', 'immediate'
    ];

    const foundSpam = spamIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );

    if (foundSpam.length > 0) {
      const confidence = Math.min(0.9, foundSpam.length * 0.2);
      
      result.categories.push({
        name: 'spam',
        confidence,
        severity: confidence > 0.6 ? 'high' : 'medium',
      });

      result.flags.push({
        type: 'spam',
        confidence,
        description: 'Content appears to be spam or promotional',
        suggestion: 'Please remove promotional or spam content',
      });
    }
  }

  private async checkCopyright(content: string, result: ModerationResult): Promise<void> {
    if (!this.filters.enableCopyrightFilter) return;

    const copyrightIndicators = [
      'copyright', '©', 'all rights reserved', 'proprietary',
      'trademark', '™', 'registered trademark', '®'
    ];

    const foundCopyright = copyrightIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );

    if (foundCopyright.length > 0) {
      result.categories.push({
        name: 'copyright',
        confidence: 0.8,
        severity: 'medium',
      });

      result.flags.push({
        type: 'copyright',
        confidence: 0.8,
        description: 'Content may contain copyrighted material',
        suggestion: 'Please ensure you have rights to use this content',
      });
    }
  }

  private async checkCustomFilters(content: string, result: ModerationResult): Promise<void> {
    // Check custom blocked words
    for (const word of this.filters.customBlockedWords) {
      if (content.toLowerCase().includes(word.toLowerCase())) {
        result.flags.push({
          type: 'inappropriate',
          confidence: 1.0,
          description: `Content contains blocked word: ${word}`,
          suggestion: 'Please remove the blocked content',
        });
      }
    }

    // Check custom blocked phrases
    for (const phrase of this.filters.customBlockedPhrases) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        result.flags.push({
          type: 'inappropriate',
          confidence: 1.0,
          description: `Content contains blocked phrase: ${phrase}`,
          suggestion: 'Please remove the blocked content',
        });
      }
    }
  }

  private async checkStoryStructure(storyData: any, result: ModerationResult): Promise<void> {
    // Check for minimum content requirements
    if (storyData.title.length < 3) {
      result.suggestions.push('Story title should be at least 3 characters long');
    }

    if (storyData.nodes.length === 0) {
      result.suggestions.push('Story should have at least one node');
    }

    // Check for balanced content
    const totalContentLength = storyData.nodes.reduce((sum: number, node: any) => 
      sum + node.content.length, 0
    );

    if (totalContentLength < 50) {
      result.suggestions.push('Story content seems too short - consider adding more detail');
    }

    if (totalContentLength > 50000) {
      result.suggestions.push('Story content is very long - consider breaking it into chapters');
    }
  }

  private async checkPromptQuality(promptText: string, result: ModerationResult): Promise<void> {
    // Check prompt length
    if (promptText.length < 10) {
      result.suggestions.push('Prompt is very short - consider adding more context');
    }

    if (promptText.length > 500) {
      result.suggestions.push('Prompt is very long - consider making it more concise');
    }

    // Check for question format
    if (!promptText.includes('?')) {
      result.suggestions.push('Consider formatting as a question for better "What if" prompts');
    }

    // Check for "What if" format
    if (!promptText.toLowerCase().startsWith('what if')) {
      result.suggestions.push('Consider starting with "What if" for better prompt format');
    }
  }

  private async checkPromptSafety(promptText: string, context: any, result: ModerationResult): Promise<void> {
    // Check for potentially harmful prompt patterns
    const harmfulPatterns = [
      'how to harm', 'how to hurt', 'how to kill', 'how to destroy',
      'illegal activities', 'harmful advice', 'dangerous instructions'
    ];

    for (const pattern of harmfulPatterns) {
      if (promptText.toLowerCase().includes(pattern)) {
        result.flags.push({
          type: 'inappropriate',
          confidence: 0.9,
          description: 'Prompt may encourage harmful behavior',
          suggestion: 'Please revise to avoid harmful content',
        });
      }
    }
  }

  private determineApproval(result: ModerationResult): boolean {
    // Critical flags always block
    if (result.flags.some(flag => flag.type === 'hate_speech')) {
      return false;
    }

    // High confidence inappropriate content blocks
    if (result.flags.some(flag => 
      flag.type === 'inappropriate' && flag.confidence > 0.8
    )) {
      return false;
    }

    // In strict mode, any flags block
    if (this.filters.strictMode && result.flags.length > 0) {
      return false;
    }

    return true;
  }

  private calculateConfidence(result: ModerationResult): number {
    if (result.flags.length === 0) return 1.0;

    const avgFlagConfidence = result.flags.reduce((sum, flag) => 
      sum + flag.confidence, 0
    ) / result.flags.length;

    return Math.max(0.1, 1.0 - avgFlagConfidence);
  }

  private requiresReview(result: ModerationResult): boolean {
    // Always review if there are flags
    if (result.flags.length > 0) return true;

    // Review if confidence is low
    if (result.confidence < 0.7) return true;

    // Review if there are suggestions
    if (result.suggestions.length > 0) return true;

    return false;
  }
}

// Export singleton instance
export const contentModerationService = ContentModerationService.getInstance();
