'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';

interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  categories: Array<{
    name: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  suggestions: string[];
  requiresReview: boolean;
  flags: Array<{
    type: string;
    confidence: number;
    description: string;
    suggestion?: string;
  }>;
}

interface ContentModerationPanelProps {
  content: string;
  contentType: 'story' | 'node' | 'branch' | 'prompt';
  onModerationComplete: (result: ModerationResult) => void;
  onClose: () => void;
}

export function ContentModerationPanel({
  content,
  contentType,
  onModerationComplete,
  onClose,
}: ContentModerationPanelProps) {
  const { toast } = useToast();
  const [isModerating, setIsModerating] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    moderateContent();
  }, [content, contentType]);

  const moderateContent = async () => {
    setIsModerating(true);
    
    try {
      const response = await fetch('/api/v1/moderation/moderate/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Moderation failed');
      }

      const data = await response.json();
      setResult(data.result);
      onModerationComplete(data.result);
    } catch (error) {
      console.error('Content moderation failed:', error);
      toast({
        type: 'error',
        title: 'Moderation failed',
        description: 'Failed to moderate content. Please try again.',
      });
    } finally {
      setIsModerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getFlagIcon = (type: string) => {
    switch (type) {
      case 'violence': return 'warning';
      case 'adult_content': return 'eye-off';
      case 'hate_speech': return 'x-circle';
      case 'spam': return 'mail';
      case 'copyright': return 'copyright';
      case 'inappropriate': return 'alert-triangle';
      default: return 'flag';
    }
  };

  if (isModerating) {
    return (
      <Card className="w-80">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="loading-spinner h-5 w-5"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Moderating content...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="w-80">
        <CardContent className="p-6">
          <div className="text-center">
            <Icon name="alert-circle" className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Moderation failed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Icon name="shield" className="h-5 w-5" />
            <span>Content Moderation</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant={result.isApproved ? 'outline' : 'destructive'}
              className={result.isApproved ? 'text-green-600' : 'text-red-600'}
            >
              {result.isApproved ? 'Approved' : 'Blocked'}
            </Badge>
            <Button onClick={onClose} variant="ghost" size="sm">
              <Icon name="close" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Confidence Score
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  result.confidence >= 0.8 ? 'bg-green-500' :
                  result.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Categories */}
        {result.categories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detected Categories
            </h4>
            <div className="space-y-2">
              {result.categories.map((category, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between p-2 rounded text-sm',
                    getSeverityColor(category.severity)
                  )}
                >
                  <span className="font-medium capitalize">
                    {category.name.replace('_', ' ')}
                  </span>
                  <span className="text-xs">
                    {Math.round(category.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flags */}
        {result.flags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Flags
            </h4>
            <div className="space-y-2">
              {result.flags.map((flag, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded"
                >
                  <Icon name={getFlagIcon(flag.type) as any} className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      {flag.description}
                    </p>
                    {flag.suggestion && (
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {flag.suggestion}
                      </p>
                    )}
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Confidence: {Math.round(flag.confidence * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggestions
            </h4>
            <div className="space-y-1">
              {result.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <Icon name="info" className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Required */}
        {result.requiresReview && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="alert-triangle" className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                Manual Review Required
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              This content has been flagged for manual review by our moderation team.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              onClick={moderateContent}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Icon name="refresh" className="h-4 w-4 mr-2" />
              Re-moderate
            </Button>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
            >
              <Icon name={isExpanded ? 'arrow-up' : 'arrow-down'} className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Preview
              </h5>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                {content.substring(0, 200)}
                {content.length > 200 && '...'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Content Type:</span>
                <p className="font-medium capitalize">{contentType}</p>
              </div>
              <div>
                <span className="text-gray-500">Content Length:</span>
                <p className="font-medium">{content.length} characters</p>
              </div>
              <div>
                <span className="text-gray-500">Approved:</span>
                <p className="font-medium">{result.isApproved ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-gray-500">Review Required:</span>
                <p className="font-medium">{result.requiresReview ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
