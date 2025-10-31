'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';

interface GeneratedPrompt {
  id: string;
  prompt_text: string;
  type: 'logical' | 'creative' | 'twist' | 'character' | 'thematic';
  tags: string[];
  impact: number;
  confidence_score: number;
}

interface HistoryEntry {
  id: string;
  parameters: any;
  prompts: GeneratedPrompt[];
  created_at: string;
}

interface SimulatorHistoryProps {
  history: HistoryEntry[];
  onRestoreParameters: (parameters: any) => void;
  onRegenerate: (parameters: any) => void;
}

export function SimulatorHistory({ history, onRestoreParameters, onRegenerate }: SimulatorHistoryProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const toggleEntry = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const toggleSelection = (entryId: string) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntries(newSelection);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all generation history? This action cannot be undone.')) {
      // Would clear history
    }
  };

  const exportSelected = () => {
    if (selectedEntries.size === 0) return;
    
    const selectedData = history.filter(entry => selectedEntries.has(entry.id));
    const exportData = {
      exported_at: new Date().toISOString(),
      entries: selectedData,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulator-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getParameterSummary = (parameters: any) => {
    const parts = [];
    if (parameters.mode) parts.push(`Mode: ${parameters.mode}`);
    if (parameters.genre) parts.push(`Genre: ${parameters.genre}`);
    if (parameters.character?.name) parts.push(`Character: ${parameters.character.name}`);
    if (parameters.setting?.place) parts.push(`Setting: ${parameters.setting.place}`);
    return parts.length > 0 ? parts.join(' • ') : 'Basic generation';
  };

  const getPromptTypeDistribution = (prompts: GeneratedPrompt[]) => {
    const types = prompts.reduce((acc, prompt) => {
      acc[prompt.type] = (acc[prompt.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  };

  const getAverageImpact = (prompts: GeneratedPrompt[]) => {
    if (prompts.length === 0) return 0;
    return prompts.reduce((sum, prompt) => sum + prompt.impact, 0) / prompts.length;
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon name="clock" className="h-5 w-5" />
            <span>Generation History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Icon name="clock" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No generation history yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your prompt generation sessions will appear here for easy access and reference.
            </p>
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
            <Icon name="clock" className="h-5 w-5" />
            <span>Generation History</span>
            <Badge variant="outline">{history.length}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            {selectedEntries.size > 0 && (
              <>
                <Button onClick={exportSelected} variant="outline" size="sm">
                  <Icon name="download" className="h-4 w-4 mr-2" />
                  Export Selected ({selectedEntries.size})
                </Button>
                <Button 
                  onClick={() => setSelectedEntries(new Set())} 
                  variant="ghost" 
                  size="sm"
                >
                  Clear Selection
                </Button>
              </>
            )}
            <Button onClick={clearHistory} variant="ghost" size="sm">
              <Icon name="delete" className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleSelection(entry.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Generation Session
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {entry.prompts.length} prompts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatRelativeTime(entry.created_at)} • {getParameterSummary(entry.parameters)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => onRestoreParameters(entry.parameters)}
                      variant="outline"
                      size="sm"
                    >
                      <Icon name="refresh" className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button
                      onClick={() => onRegenerate(entry.parameters)}
                      variant="outline"
                      size="sm"
                    >
                      <Icon name="zap" className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => toggleEntry(entry.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Icon
                        name={expandedEntry === entry.id ? 'arrow-up' : 'arrow-down'}
                        className="h-4 w-4"
                      />
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-3 flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Icon name="zap" className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Avg Impact: {(getAverageImpact(entry.prompts) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPromptTypeDistribution(entry.prompts).map(({ type, count }) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedEntry === entry.id && (
                <div className="p-4 space-y-4">
                  {/* Parameters */}
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Parameters Used</h5>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Mode:</span>
                          <p className="font-medium">{entry.parameters.mode || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Genre:</span>
                          <p className="font-medium">{entry.parameters.genre || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Character:</span>
                          <p className="font-medium">{entry.parameters.character?.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Setting:</span>
                          <p className="font-medium">{entry.parameters.setting?.place || 'Not specified'}</p>
                        </div>
                      </div>
                      {entry.parameters.event && (
                        <div className="mt-2">
                          <span className="text-gray-500">Event:</span>
                          <p className="font-medium">{entry.parameters.event}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generated Prompts */}
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Generated Prompts</h5>
                    <div className="space-y-2">
                      {entry.prompts.map((prompt, index) => (
                        <div key={prompt.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {prompt.type}
                              </Badge>
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Impact: {(prompt.impact * 100).toFixed(0)}%</span>
                              <span>Confidence: {(prompt.confidence_score * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">{prompt.prompt_text}</p>
                          {prompt.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {prompt.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Generated: {formatDateTime(entry.created_at)}</span>
                      <span>Session ID: {entry.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination would go here if needed */}
          {history.length >= 10 && (
            <div className="text-center pt-4">
              <Button variant="outline">
                Load More History
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
