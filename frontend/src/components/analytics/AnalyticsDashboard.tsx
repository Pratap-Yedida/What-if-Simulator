'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';

interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalStoriesCreated: number;
  totalNodesCreated: number;
  totalBranchesCreated: number;
  totalPromptsGenerated: number;
  averageSessionDuration: number;
  lastActiveAt: string;
  favoriteGenres: string[];
  mostUsedFeatures: string[];
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemAnalytics {
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
  lastUpdated: string;
}

interface EngagementMetrics {
  totalEvents: number;
  uniqueUsers: number;
  averageEventsPerUser: number;
  topEventTypes: Array<{ type: string; count: number }>;
  engagementRate: number;
}

interface AnalyticsDashboardProps {
  isAdmin?: boolean;
}

export function AnalyticsDashboard({ isAdmin = false }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalytics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      setUserAnalytics(data.dashboard.user);
      setSystemAnalytics(data.dashboard.system);
      setEngagementMetrics(data.dashboard.engagement);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        type: 'error',
        title: 'Analytics Error',
        description: 'Failed to load analytics data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="skeleton h-4 w-20"></div>
                  <div className="skeleton h-8 w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your activity and engagement
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <Icon name="refresh" className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Analytics */}
      {userAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Stories Created
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userAnalytics.totalStoriesCreated}
                  </p>
                </div>
                <Icon name="book" className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Nodes
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userAnalytics.totalNodesCreated}
                  </p>
                </div>
                <Icon name="file-text" className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Branches
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userAnalytics.totalBranchesCreated}
                  </p>
                </div>
                <Icon name="git-branch" className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Prompts Generated
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userAnalytics.totalPromptsGenerated}
                  </p>
                </div>
                <Icon name="zap" className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Analytics (Admin Only) */}
      {isAdmin && systemAnalytics && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(systemAnalytics.totalUsers)}
                    </p>
                  </div>
                  <Icon name="users" className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Stories
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(systemAnalytics.totalStories)}
                    </p>
                  </div>
                  <Icon name="book" className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(systemAnalytics.activeUsers)}
                    </p>
                  </div>
                  <Icon name="activity" className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      New Today
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {systemAnalytics.newUsersToday} users
                    </p>
                  </div>
                  <Icon name="trending-up" className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      {engagementMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon name="activity" className="h-5 w-5" />
                <span>Engagement Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Events
                  </span>
                  <span className="font-semibold">{formatNumber(engagementMetrics.totalEvents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Unique Users
                  </span>
                  <span className="font-semibold">{formatNumber(engagementMetrics.uniqueUsers)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Events/User
                  </span>
                  <span className="font-semibold">
                    {engagementMetrics.averageEventsPerUser.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Engagement Rate
                  </span>
                  <span className="font-semibold">
                    {(engagementMetrics.engagementRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon name="bar-chart" className="h-5 w-5" />
                <span>Top Event Types</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {engagementMetrics.topEventTypes.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {event.type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(event.count / engagementMetrics.topEventTypes[0].count) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {formatNumber(event.count)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Details */}
      {userAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon name="user" className="h-5 w-5" />
                <span>Account Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Subscription
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {userAnalytics.subscriptionTier}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Sessions
                  </span>
                  <span className="font-medium">{userAnalytics.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Session Duration
                  </span>
                  <span className="font-medium">
                    {formatDuration(userAnalytics.averageSessionDuration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Last Active
                  </span>
                  <span className="font-medium">
                    {formatDate(userAnalytics.lastActiveAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Member Since
                  </span>
                  <span className="font-medium">
                    {formatDate(userAnalytics.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon name="star" className="h-5 w-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAnalytics.favoriteGenres.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Favorite Genres
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {userAnalytics.favoriteGenres.map((genre, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {userAnalytics.mostUsedFeatures.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Most Used Features
                    </h4>
                    <div className="space-y-1">
                      {userAnalytics.mostUsedFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                            {feature.replace('_', ' ')}
                          </span>
                          <Icon name="trending-up" className="h-4 w-4 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popular Genres (Admin Only) */}
      {isAdmin && systemAnalytics && systemAnalytics.mostPopularGenres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon name="trending-up" className="h-5 w-5" />
              <span>Most Popular Genres</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAnalytics.mostPopularGenres.slice(0, 10).map((genre, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {genre.genre.replace('_', ' ')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {genre.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {formatNumber(genre.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
