'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface GeneratedPrompt {
  id: string;
  prompt_text: string;
  type: 'logical' | 'creative' | 'twist' | 'character' | 'thematic';
  tags: string[];
  impact: number;
  confidence_score: number;
  generation_method: string;
  created_at: string;
}

interface GeneratedPromptListProps {
  prompts: GeneratedPrompt[];
  isLoading: boolean;
  onPromptAction: (promptId: string, action: 'save' | 'copy' | 'export' | 'edit') => void;
}

export function GeneratedPromptList({ prompts, isLoading, onPromptAction }: GeneratedPromptListProps) {
  const [sortBy, setSortBy] = useState<'impact' | 'confidence' | 'created_at'>('impact');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'logical': return 'blue';
      case 'creative': return 'purple';
      case 'twist': return 'orange';
      case 'character': return 'green';
      case 'thematic': return 'red';
      default: return 'gray';
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 0.8) return 'text-red-600';
    if (impact >= 0.6) return 'text-orange-600';
    if (impact >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getImpactLabel = (impact: number) => {
    if (impact >= 0.8) return 'High';
    if (impact >= 0.6) return 'Medium-High';
    if (impact >= 0.4) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter and sort prompts
  const filteredPrompts = prompts
    .filter(prompt => filterType === 'all' || prompt.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return b.impact - a.impact;
        case 'confidence':
          return b.confidence_score - a.confidence_score;
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const promptTypes = ['all', 'logical', 'creative', 'twist', 'character', 'thematic'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon name="zap" className="h-5 w-5" />
            <span>Generating Prompts...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="prompt-card animate-pulse">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="skeleton h-6 w-20"></div>
                    <div className="skeleton h-4 w-16"></div>
                  </div>
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="skeleton h-6 w-16"></div>
                    <div className="skeleton h-6 w-20"></div>
                    <div className="skeleton h-6 w-18"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="book" className="h-5 w-5" />
            <span>Generated Prompts</span>
            <Badge variant="outline">{filteredPrompts.length}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {promptTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="impact">Sort by Impact</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="created_at">Sort by Recent</option>
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="zap" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No prompts generated yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your parameters and click "Generate Prompts" to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((prompt, index) => (
              <div
                key={prompt.id}
                className={cn(
                  'prompt-card transition-all duration-200 hover:shadow-lg',
                  prompt.type === 'creative' && 'creative-prompt',
                  prompt.type === 'logical' && 'logical-prompt'
                )}
              >
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={`text-${getPromptTypeColor(prompt.type)}-600 border-${getPromptTypeColor(prompt.type)}-200`}
                        >
                          {prompt.type}
                        </Badge>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500">Impact:</span>
                          <span className={getImpactColor(prompt.impact)}>
                            {getImpactLabel(prompt.impact)} ({prompt.impact.toFixed(2)})
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500">Confidence:</span>
                          <span className={getConfidenceColor(prompt.confidence_score)}>
                            {Math.round(prompt.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prompt Text */}
                    <div className="relative">
                      <p className="text-gray-900 dark:text-white font-medium leading-relaxed text-lg">
                        {prompt.prompt_text}
                      </p>
                      
                      {/* Expand/Collapse for long prompts */}
                      {prompt.prompt_text.length > 200 && (
                        <button
                          onClick={() => setExpandedPrompt(
                            expandedPrompt === prompt.id ? null : prompt.id
                          )}
                          className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                        >
                          {expandedPrompt === prompt.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>

                    {/* Tags */}
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {prompt.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Metadata (expanded view) */}
                    {expandedPrompt === prompt.id && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Method:</span>
                            <p className="font-medium">{prompt.generation_method}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Generated:</span>
                            <p className="font-medium">
                              {new Date(prompt.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Icon name="zap" className="h-3 w-3" />
                        <span>{prompt.generation_method}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPromptAction(prompt.id, 'copy')}
                          className="text-xs"
                        >
                          <Icon name="copy" className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPromptAction(prompt.id, 'save')}
                          className="text-xs"
                        >
                          <Icon name="bookmark" className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPromptAction(prompt.id, 'export')}
                          className="text-xs"
                        >
                          <Icon name="share" className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => onPromptAction(prompt.id, 'edit')}
                          className="text-xs"
                        >
                          <Icon name="edit" className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Export All Button */}
            {filteredPrompts.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} generated
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Icon name="download" className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                    <Button variant="outline" size="sm">
                      <Icon name="refresh" className="h-4 w-4 mr-2" />
                      Generate More
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
