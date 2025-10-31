import { logger } from '@/utils/logger';

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventCategory: string;
  eventData: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalStoriesCreated: number;
  totalNodesCreated: number;
  totalBranchesCreated: number;
  totalPromptsGenerated: number;
  averageSessionDuration: number;
  lastActiveAt: Date;
  favoriteGenres: string[];
  mostUsedFeatures: string[];
  subscriptionTier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryAnalytics {
  storyId: string;
  viewCount: number;
  uniqueViewers: number;
  likeCount: number;
  shareCount: number;
  completionRate: number;
  averageReadingTime: number;
  mostPopularBranches: Array<{
    branchId: string;
    selectionCount: number;
    percentage: number;
  }>;
  userEngagement: {
    comments: number;
    bookmarks: number;
    reports: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    devices: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemAnalytics {
  totalUsers: number;
  totalStories: number;
  totalNodes: number;
  totalBranches: number;
  totalPromptsGenerated: number;
  activeUsers: number;
  newUsersToday: number;
  newStoriesToday: number;
  averageStoriesPerUser: number;
  mostPopularGenres: Array<{
    genre: string;
    count: number;
    percentage: number;
  }>;
  systemHealth: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
  lastUpdated: Date;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];
  private userAnalytics: Map<string, UserAnalytics> = new Map();
  private storyAnalytics: Map<string, StoryAnalytics> = new Map();
  private systemAnalytics: SystemAnalytics;

  private constructor() {
    this.systemAnalytics = {
      totalUsers: 0,
      totalStories: 0,
      totalNodes: 0,
      totalBranches: 0,
      totalPromptsGenerated: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newStoriesToday: 0,
      averageStoriesPerUser: 0,
      mostPopularGenres: [],
      systemHealth: {
        uptime: 0,
        averageResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
      },
      lastUpdated: new Date(),
    };
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        id: this.generateId(),
        timestamp: new Date(),
      };

      this.events.push(analyticsEvent);

      // Update user analytics if userId is provided
      if (event.userId) {
        await this.updateUserAnalytics(event.userId, event);
      }

      // Update story analytics if storyId is in eventData
      if (event.eventData.storyId) {
        await this.updateStoryAnalytics(event.eventData.storyId, event);
      }

      // Update system analytics
      await this.updateSystemAnalytics(event);

      logger.debug('Analytics event tracked', {
        eventType: event.eventType,
        userId: event.userId,
        sessionId: event.sessionId,
      });
    } catch (error) {
      logger.error('Failed to track analytics event', { error, event });
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    return this.userAnalytics.get(userId) || null;
  }

  /**
   * Get story analytics
   */
  async getStoryAnalytics(storyId: string): Promise<StoryAnalytics | null> {
    return this.storyAnalytics.get(storyId) || null;
  }

  /**
   * Get system analytics
   */
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    return { ...this.systemAnalytics };
  }

  /**
   * Get analytics events for a user
   */
  async getUserEvents(userId: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    return this.events
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get analytics events for a story
   */
  async getStoryEvents(storyId: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    return this.events
      .filter(event => event.eventData.storyId === storyId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get popular content
   */
  async getPopularContent(type: 'stories' | 'genres' | 'features', limit: number = 10): Promise<any[]> {
    switch (type) {
      case 'stories':
        return Array.from(this.storyAnalytics.values())
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, limit);

      case 'genres':
        return this.systemAnalytics.mostPopularGenres.slice(0, limit);

      case 'features':
        const featureUsage = new Map<string, number>();
        this.events.forEach(event => {
          if (event.eventCategory === 'feature_usage') {
            const feature = event.eventData.feature;
            featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
          }
        });
        return Array.from(featureUsage.entries())
          .map(([feature, count]) => ({ feature, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);

      default:
        return [];
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    averageEventsPerUser: number;
    topEventTypes: Array<{ type: string; count: number }>;
    engagementRate: number;
  }> {
    const now = new Date();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const startTime = new Date(now.getTime() - timeframeMs);

    const recentEvents = this.events.filter(event => event.timestamp >= startTime);
    const uniqueUsers = new Set(recentEvents.map(event => event.userId).filter(Boolean));

    const eventTypeCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      eventTypeCounts.set(event.eventType, (eventTypeCounts.get(event.eventType) || 0) + 1);
    });

    const topEventTypes = Array.from(eventTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      uniqueUsers: uniqueUsers.size,
      averageEventsPerUser: uniqueUsers.size > 0 ? recentEvents.length / uniqueUsers.size : 0,
      topEventTypes,
      engagementRate: uniqueUsers.size > 0 ? recentEvents.length / uniqueUsers.size : 0,
    };
  }

  // Private methods

  private async updateUserAnalytics(userId: string, event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    let userAnalytics = this.userAnalytics.get(userId);

    if (!userAnalytics) {
      userAnalytics = {
        userId,
        totalSessions: 0,
        totalStoriesCreated: 0,
        totalNodesCreated: 0,
        totalBranchesCreated: 0,
        totalPromptsGenerated: 0,
        averageSessionDuration: 0,
        lastActiveAt: new Date(),
        favoriteGenres: [],
        mostUsedFeatures: [],
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Update based on event type
    switch (event.eventType) {
      case 'story_created':
        userAnalytics.totalStoriesCreated++;
        break;
      case 'node_created':
        userAnalytics.totalNodesCreated++;
        break;
      case 'branch_created':
        userAnalytics.totalBranchesCreated++;
        break;
      case 'prompt_generated':
        userAnalytics.totalPromptsGenerated++;
        break;
      case 'session_start':
        userAnalytics.totalSessions++;
        break;
    }

    // Update last active
    userAnalytics.lastActiveAt = new Date();
    userAnalytics.updatedAt = new Date();

    this.userAnalytics.set(userId, userAnalytics);
  }

  private async updateStoryAnalytics(storyId: string, event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    let storyAnalytics = this.storyAnalytics.get(storyId);

    if (!storyAnalytics) {
      storyAnalytics = {
        storyId,
        viewCount: 0,
        uniqueViewers: 0,
        likeCount: 0,
        shareCount: 0,
        completionRate: 0,
        averageReadingTime: 0,
        mostPopularBranches: [],
        userEngagement: {
          comments: 0,
          bookmarks: 0,
          reports: 0,
        },
        demographics: {
          ageGroups: {},
          locations: {},
          devices: {},
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Update based on event type
    switch (event.eventType) {
      case 'story_viewed':
        storyAnalytics.viewCount++;
        break;
      case 'story_liked':
        storyAnalytics.likeCount++;
        break;
      case 'story_shared':
        storyAnalytics.shareCount++;
        break;
      case 'story_completed':
        storyAnalytics.completionRate = (storyAnalytics.completionRate + 1) / 2; // Simple average
        break;
    }

    storyAnalytics.updatedAt = new Date();
    this.storyAnalytics.set(storyId, storyAnalytics);
  }

  private async updateSystemAnalytics(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    // Update system-wide metrics
    switch (event.eventType) {
      case 'user_registered':
        this.systemAnalytics.totalUsers++;
        this.systemAnalytics.newUsersToday++;
        break;
      case 'story_created':
        this.systemAnalytics.totalStories++;
        this.systemAnalytics.newStoriesToday++;
        break;
      case 'node_created':
        this.systemAnalytics.totalNodes++;
        break;
      case 'branch_created':
        this.systemAnalytics.totalBranches++;
        break;
      case 'prompt_generated':
        this.systemAnalytics.totalPromptsGenerated++;
        break;
    }

    // Update averages
    if (this.systemAnalytics.totalUsers > 0) {
      this.systemAnalytics.averageStoriesPerUser = this.systemAnalytics.totalStories / this.systemAnalytics.totalUsers;
    }

    this.systemAnalytics.lastUpdated = new Date();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
